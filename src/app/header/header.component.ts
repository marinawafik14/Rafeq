import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../Services/auth.service';
import { TokenResponseDto } from '../Models/Auth/TokenResponseDto';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { NotificationBadgeComponent } from '../shared/components/notification-badge/notification-badge.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, RouterLink, CommonModule, NotificationBadgeComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: TokenResponseDto | null = null;
  private destroy = new Subject<void>();
  role: string = '';
   @Input() menteeName: string = '';
  @Input() menteeId: number | null = null;
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser
      .pipe(takeUntil(this.destroy))
      .subscribe(user => {
        this.currentUser = user;
  
     
      });

      if (this.menteeId) return;
      const routeId = this.route.snapshot.paramMap.get('menteeId');
  if (routeId) {
    this.menteeId = +routeId;
    return;
  }

  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user?.userId && user?.role === 'Mentee') {
        this.menteeId = +user.userId;
      }
    } catch (e) {
      console.error('Invalid user data in localStorage');
    }
  }
  }


navigateTo(link: any) {
    if (!this.menteeId) {
      const id = this.route.snapshot.paramMap.get('menteeId');
      if (id) this.menteeId = +id;
    }
    
    if (this.menteeId) {
      const commands = ['/mentee', this.menteeId, link.route];
      this.router.navigate(commands, {
        queryParams: { t: Date.now() },
        queryParamsHandling: 'merge',
      });
    }
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
 isMentee(): boolean {
  return this.currentUser !== null && this.role === 'Mentee';
}
  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }
 
}
