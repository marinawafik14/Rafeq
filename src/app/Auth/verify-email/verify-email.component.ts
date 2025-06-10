import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {

  constructor(
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      const token = params['token'];
      console.log('Extracted token from URL:', token);

      if (token) {
        this.authService.verifyEmail(token).subscribe({
          next: (response: any) => {
            this.toastr.success(response.message || 'Email verified successfully! You can now log in.', 'Verification Success');
            this.router.navigate(['/login']);
          },
          error: (err: any) => {
            const errorMessage = err.message || 'Email verification failed. Please try again.';
            this.toastr.error(errorMessage, 'Verification Failed');
            console.error('Email verification error:', err);
            this.router.navigate(['/login']);
          }
        });
      } else {
        this.toastr.error('Verification link is missing a token.', 'Invalid Link');
        this.router.navigate(['/login']);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
