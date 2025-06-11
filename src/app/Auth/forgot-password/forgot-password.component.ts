import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/auth.service';
import { ForgotPasswordDto } from '../../Models/Auth/ForgotPasswordDto';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }

  get email() { return this.forgotPasswordForm.get('email'); }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      this.toastr.error(' Enter a valid email address.', 'Validation Error');
      return;
    }

    const forgotPasswordDto: ForgotPasswordDto = this.forgotPasswordForm.value;

    this.authService.forgotPassword(forgotPasswordDto).subscribe({
      next: () => {
        this.toastr.success('Check your account, a password reset link has been sent.', 'Password Reset Link Sent');
        this.forgotPasswordForm.reset();
      },
      error: (err) => {
        console.error('Forgot password API error:', err);
        this.toastr.success('Check your email, a password reset link has been sent.', 'Password Reset Link Sent');
      }
    });
  }
}
