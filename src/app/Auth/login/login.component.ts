import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../Services/auth.service';
import { GoogleScriptService } from '../../Services/google-script.service';
import { LoginDto } from '../../Models/Auth/LoginDto';
import { TokenResponseDto } from '../../Models/Auth/TokenResponseDto';
import { ExternalLoginDto } from '../../Models/Auth/ExternalLoginDto';

import { take } from 'rxjs/operators';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  returnUrl: string = '/';
  showPassword: boolean = false;

  private GOOGLE_CLIENT_ID =
    '976759573700-s519knu28logettgf4cp1dkrev1ikb2s.apps.googleusercontent.com';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private ngZone: NgZone,
    private googleScriptService: GoogleScriptService
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
      rememberMe: new FormControl(false),
    });

    this.googleScriptService
      .isScriptLoaded()
      .pipe(take(1))
      .subscribe({
        next: (loaded) => {
          if (loaded) {
            this.initializeGoogleSignIn();
          } else {
            console.warn(
              'Google Identity Services script not loaded. External login may not function.'
            );
            this.toastr.warning(
              'Google Sign-In is unavailable. Please try again later or use email/password.',
              'Warning'
            );
          }
        },
        error: (err) => {
          console.error('Error loading Google Identity Services:', err);
          this.toastr.error(
            'Failed to load Google Sign-In. Please check your internet connection.',
            'Error'
          );
        },
      });
  }

  private initializeGoogleSignIn(): void {
    if (typeof google !== 'undefined') {
      this.ngZone.runOutsideAngular(() => {
        google.accounts.id.initialize({
          client_id: this.GOOGLE_CLIENT_ID,
          callback: (response: any) =>
            this.ngZone.run(() => this.handleGoogleLogin(response)),
          ux_mode: 'popup',
        });

        google.accounts.id.renderButton(
          document.getElementById('google-btn-container'),
          {
            type: 'standard',
            size: 'large',
            theme: 'outline',
            text: 'signin_with',
            shape: 'rectangular',
            locale: 'en-US',
            logo_alignment: 'left',
          }
        );
      });
    }
  }

  get email() {
    return this.loginForm.get('email');
  }
  get password() {
    return this.loginForm.get('password');
  }
  get rememberMe() {
    return this.loginForm.get('rememberMe');
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  resetFormData(): void {
    this.loginForm.reset({
      email: '',
      password: '',
      rememberMe: false,
    });
    this.showPassword = false;

    if (
      typeof google !== 'undefined' &&
      google.accounts &&
      google.accounts.id
    ) {
      google.accounts.id.cancel();
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toastr.error('Please enter valid credentials.', 'Validation Error');
      return;
    }

    const loginDto: LoginDto = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      rememberMe: this.loginForm.value.rememberMe,
    };

    this.authService.login(loginDto).subscribe({
      next: (response: { message: string; tokenData: TokenResponseDto }) => {
        this.toastr.success(response.message || 'Login successful!', 'Success');

        if (loginDto.rememberMe) {
          sessionStorage.setItem('rememberMe', 'true');
        } else {
          sessionStorage.removeItem('rememberMe');
        }

        this.resetFormData();

        if (
          response.tokenData.role &&
          response.tokenData.role.toLowerCase() === 'admin'
        ) {
          this.router.navigate(['/admin/charts']);
        } else if (
          response.tokenData.role &&
          response.tokenData.role.toLowerCase() === 'mentee'
        ) {
          const menteeId = response.tokenData.userId;
          if (menteeId) {
            this.router.navigate(['/mentee/dashboard']);
          } else {
            this.toastr.error(
              'Mentee ID not found in token.',
              'Navigation Error'
            );
            this.router.navigate([this.returnUrl]);
          }
        } else {
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (err: any) => {
        const errorMessage =
          err.error && typeof err.error === 'string'
            ? err.error
            : 'Login failed: Invalid credentials or unverified email.';
        this.toastr.error(errorMessage, 'Error');
        console.error('Login error:', err);
      },
    });
  }

  handleGoogleLogin(response: any): void {
    this.ngZone.run(() => {
      if (response && response.credential) {
        const idToken = response.credential;

        try {
          const decodedToken = JSON.parse(atob(idToken.split('.')[1]));

          const externalLoginDto: ExternalLoginDto = {
            provider: 'google',
            idToken: idToken,
            fullName:
              decodedToken.name ||
              decodedToken.given_name + ' ' + decodedToken.family_name ||
              'Google User',
            email: decodedToken.email,
            profilePicture: decodedToken.picture || null,
            role: 'Mentee',
          };

          this.authService.externalLogin(externalLoginDto).subscribe({
            next: (apiResponse: {
              message: string;
              tokenData: TokenResponseDto;
            }) => {
              this.toastr.success(
                apiResponse.message || 'Google login successful!',
                'Success'
              );

              this.resetFormData();

              if (
                apiResponse.tokenData.role &&
                apiResponse.tokenData.role.toLowerCase() === 'admin'
              ) {
                this.router.navigate(['/admin/charts']);
              } else if (
                apiResponse.tokenData.role &&
                apiResponse.tokenData.role.toLowerCase() === 'mentee'
              ) {
                const menteeId = apiResponse.tokenData.userId;
                if (menteeId) {
                  this.router.navigate([`/mentee/${menteeId}/dashboard`]);
                } else {
                  this.toastr.error(
                    'Mentee ID not found in token.',
                    'Navigation Error'
                  );
                  this.router.navigate([this.returnUrl]);
                }
              } else {
                this.router.navigate([this.returnUrl]);
              }
            },
            error: (err: any) => {
              const errorMessage =
                err.error && typeof err.error === 'string'
                  ? err.error
                  : 'Google login failed. Please try again.';
              this.toastr.error(errorMessage, 'Error');
              console.error('Google login error:', err);
            },
          });
        } catch (error) {
          console.error(
            'Failed to decode Google ID token or invalid token:',
            error
          );
          this.toastr.error(
            'Google login failed due to token processing error.',
            'Error'
          );
        }
      } else {
        this.toastr.error(
          'Google login failed: No credential received from Google.',
          'Error'
        );
      }
    });
  }
}
