import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

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
    { label: 'Messages', route: 'messages', icon: 'bx-chat' },
    { label: 'Profile', route: 'profile', icon: 'bx-user' }
  ];

  sidebarOpen = true;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
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


  ngAfterViewInit(): void {
    // Initialize sidebar toggle functionality
    const sidebar = document.querySelector('.sidebar');
    const sidebarBtn = document.querySelector('.bx-menu');
    
    // Arrow functionality for submenus if needed
    const arrows = document.querySelectorAll(".arrow");
    arrows.forEach(arrow => {
      arrow.addEventListener('click', e => {
        const arrowParent = (e.target as HTMLElement).parentElement?.parentElement;
        arrowParent?.classList.toggle("showMenu");
      });
    });

    // Main sidebar toggle
    if (sidebarBtn && sidebar) {
      sidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('close');
        this.sidebarOpen = !this.sidebarOpen;
      });
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
      }).then(() => {
        if (window.innerWidth < 768) {
          this.sidebarOpen = false;
          document.querySelector('.sidebar')?.classList.add('close');
        }
      });
    }
  }

  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('close');
    }
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  }
}