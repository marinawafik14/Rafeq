import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../Services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { TokenResponseDto } from '../Models/Auth/TokenResponseDto';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [RouterModule,RouterLink,CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit ,OnDestroy {
 currentUser: TokenResponseDto | null = null;
  private destroy = new Subject<void>();
constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser
      .pipe(takeUntil(this.destroy))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  logout(): void {

    if (!this.authService.isLoggedIn()) {
      this.toastr.info('You are already logged out.', 'Info');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.logout().subscribe({
      next: (response: { message: string }) => {
        this.toastr.success(response.message || 'You have been logged out successfully.', 'Logged Out');
        this.router.navigate(['/login']);
      },
      error: (err) => {

        if (err.status === 401) {
            this.toastr.info('Your session has expired or you are already logged out.', 'Session Ended');
            this.authService.clearToken();
            this.router.navigate(['/login']);
        } else {
            this.toastr.error(err.error?.message || 'Logout failed unexpectedly. Please try again.', 'Error');
            console.error('Logout failed unexpectedly:', err);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

}
