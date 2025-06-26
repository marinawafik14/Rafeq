import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/auth.service';
import { LoginDto } from '../../Models/Auth/LoginDto';
import { TokenResponseDto } from '../../Models/Auth/TokenResponseDto';
import { ExternalLoginDto } from '../../Models/Auth/ExternalLoginDto';

// Declare 'google' global object for TypeScript
declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  returnUrl: string = '/';
  showPassword: boolean = false;

  private GOOGLE_CLIENT_ID = '574047622774-8h2bqlvm7dmhogsqn735e4bicj5qkjci.apps.googleusercontent.com';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private ngZone: NgZone
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }
  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
      rememberMe: new FormControl(false)
    });

    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: this.GOOGLE_CLIENT_ID,
        callback: (response: any) => this.handleGoogleLogin(response),
        ux_mode: 'popup',
      });

      // Render the Google Sign-In button
      google.accounts.id.renderButton(
        document.getElementById('google-btn-container'),
        {
          type: 'standard',
          size: 'large',
          theme: 'outline',
          text: 'signin_with',
          shape: 'rectangular',
          locale: 'en-US',
          logo_alignment: 'left'
        }
      );
    } else {
      console.warn('Google Identity Services script not loaded. External login may not function.');
    }
  }
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
  get rememberMe() { return this.loginForm.get('rememberMe'); }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
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
      rememberMe: this.loginForm.value.rememberMe
    };

    this.authService.login(loginDto).subscribe({
      next: (response: { message: string, tokenData: TokenResponseDto }) => {
        this.toastr.success(response.message || 'Login successful!', 'Success');

        // Handle remember me functionality
        if (loginDto.rememberMe) {
          // Store login state in localStorage for persistence
          localStorage.setItem('rememberMe', 'true');
        } else {
          // Remove remember me from localStorage
          localStorage.removeItem('rememberMe');
        }

        // Redirect based on role
        if (response.tokenData.role && response.tokenData.role.toLowerCase() === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (err: any) => {
        const errorMessage = err.error && typeof err.error === 'string'
                              ? err.error
                              : 'Login failed: Invalid credentials or unverified email.';
        this.toastr.error(errorMessage, 'Error');
        console.error('Login error:', err);
      }
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
            fullName: decodedToken.name || (decodedToken.given_name + ' ' + decodedToken.family_name) || 'Google User',
            email: decodedToken.email,
            profilePicture: decodedToken.picture || null,
            role: 'Mentee'
          };

          this.authService.externalLogin(externalLoginDto).subscribe({
            next: (apiResponse: { message: string, tokenData: TokenResponseDto }) => {
              this.toastr.success(apiResponse.message || 'Google login successful!', 'Success');
              // Redirect based on role
              if (apiResponse.tokenData.role && apiResponse.tokenData.role.toLowerCase() === 'admin') {
                this.router.navigate(['/admin']);
              } else {
                this.router.navigate([this.returnUrl]);
              }
            },
            error: (err: any) => {
              const errorMessage = err.error && typeof err.error === 'string'
                                    ? err.error
                                    : 'Google login failed. Please try again.';
              this.toastr.error(errorMessage, 'Error');
              console.error('Google login error:', err);
            }
          });

        } catch (error) {
          console.error('Failed to decode Google ID token:', error);
          this.toastr.error('Google login failed due to token processing error.', 'Error');
        }
      } else {
        this.toastr.error('Google login failed: No credential received from Google.', 'Error');
      }
    });
  }
}
