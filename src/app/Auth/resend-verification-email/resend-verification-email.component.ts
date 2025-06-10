import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/auth.service';
import { ResendVerificationDto } from '../../Models/Auth/ResendVerificationDto';

@Component({
  selector: 'app-resend-verification-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './resend-verification-email.component.html',
  styleUrl: './resend-verification-email.component.css'
})
export class ResendVerificationEmailComponent implements OnInit {
  resendForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.resendForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }

  get email() { return this.resendForm.get('email'); }

  onSubmit(): void {
    if (this.resendForm.invalid) {
      this.resendForm.markAllAsTouched();
      this.toastr.error('Please enter a valid email address.', 'Validation Error');
      return;
    }

    const resendDto: ResendVerificationDto = this.resendForm.value as ResendVerificationDto;

    this.authService.resendVerificationEmail(resendDto.email).subscribe({
      next: (response: string) => {
        this.toastr.success(response || 'Verification Email Sent.', 'Verification Email Sent');
        this.resendForm.reset();
      },
      error: (err) => {
        console.error('Resend verification API error:', err);
        this.toastr.error('Failed to resend verification email. Try again later.', 'Error');
      }
    });
  }
}
