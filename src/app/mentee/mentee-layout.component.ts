import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../Services/auth.service';

@Component({
  selector: 'mentee-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mentee-layout.component.html',
  styleUrls: ['./mentee-layout.component.css']
})
export class MenteeLayoutComponent implements OnInit, AfterViewInit {
  @Input() menteeName: string = '';
  @Input() menteeId: number | null = null;
  @Input() quickLinks: Array<{ label: string; route: string; icon: string }> = [
    { label: 'Dashboard', route: 'dashboard', icon: 'bx-home' },
    { label: 'Bookings', route: 'bookings', icon: 'bx-calendar' },
    { label: 'Search Mentors', route: 'search-mentors', icon: 'bx-search' },
    { label: 'CV Management', route: 'cv-management', icon: 'bx-file' },
    { label: 'AI Assistant', route: 'ai-chatbot', icon: 'bx-bot' }, 
    { label: 'Messages', route: 'messages', icon: 'bx-chat' },
    { label: 'Profile', route: 'profile', icon: 'bx-user' }
  ];

  sidebarOpen = true;

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (this.menteeId) return;
    const user = this.authService.currentUserValue;
    if (user && user.role === 'Mentee') {
      this.menteeId = user.userId;
      this.menteeName = user.fullName;
    }
  }

  ngAfterViewInit(): void {
    const sidebar = document.querySelector('.sidebar');
    const sidebarBtn = document.querySelector('.bx-menu');
    const arrows = document.querySelectorAll(".arrow");
    arrows.forEach(arrow => {
      arrow.addEventListener('click', e => {
        const arrowParent = (e.target as HTMLElement).parentElement?.parentElement;
        arrowParent?.classList.toggle("showMenu");
      });
    });

    if (sidebarBtn && sidebar) {
      sidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('close');
        this.sidebarOpen = !this.sidebarOpen;
      });
    }
  }

  navigateTo(link: any) {
    const commands = ['/mentee', link.route];
    this.router.navigate(commands).then(() => {
      if (window.innerWidth < 768) {
        this.sidebarOpen = false;
        document.querySelector('.sidebar')?.classList.add('close');
      }
    });
  }

  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('close');
    }
    this.sidebarOpen = !this.sidebarOpen;
  }

  async logout(): Promise<void> {
    try {
      sessionStorage.removeItem('pendingBooking');
      
      this.authService.logout().subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Logout error:', error);
          this.authService.clearToken();
          this.router.navigate(['/login']);
        }
      });
    } catch (error) {
      console.error('Logout failed:', error);
      this.authService.clearToken();
      this.router.navigate(['/login']);
    }
  }
}