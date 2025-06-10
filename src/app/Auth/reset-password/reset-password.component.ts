import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/auth.service';
import { ResetPasswordDto } from '../../Models/Auth/ResetPasswordDto';
import { passwordsMatchValidator } from '../../shared/validators/password-match.validator';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  tokenFound: boolean = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.resetPasswordForm = new FormGroup(
      {
        token: new FormControl(''),
        newPassword: new FormControl('', [
          Validators.required,
          Validators.minLength(6),
        ]),
        confirmNewPassword: new FormControl('', [Validators.required]),
      },
      {
        validators: passwordsMatchValidator('newPassword', 'confirmNewPassword'),
      }
    );

    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.resetPasswordForm.patchValue({ token: token });
        this.tokenFound = true;
      } else {

        this.toastr.error('Password reset token is missing from the URL.', 'Error');
        this.tokenFound = false;
      }
    });
  }

  get newPassword() { return this.resetPasswordForm.get('newPassword'); }
  get confirmNewPassword() { return this.resetPasswordForm.get('confirmNewPassword'); }
  get token() { return this.resetPasswordForm.get('token'); }

  onSubmit(): void {
    if (!this.tokenFound || !this.token?.value) {
      this.toastr.error('Cannot reset password: Token is missing or invalid.', 'Error');
      return;
    }

    this.resetPasswordForm.markAllAsTouched();

    if (this.resetPasswordForm.invalid) {
      this.toastr.error('Please correct the errors in the form.', 'Validation Error');
      return;
    }

    const resetPasswordDto: ResetPasswordDto = {
      token: this.token?.value,
      newPassword: this.newPassword?.value
    };

    this.authService.resetPassword(resetPasswordDto).subscribe({
      next: (response: string) => {

        this.toastr.success(response || 'Password has been reset successfully!', 'Success');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        const errorMessage = err.message || 'Password reset failed. An unexpected error occurred.';
        this.toastr.error(errorMessage, 'Error');
        console.error('Password reset error:', err);
      }
    });
  }
}
