import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'mentee-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mentee-layout.component.html',
  styleUrls: ['./mentee-layout.component.css']
})
export class MenteeLayoutComponent implements OnInit {
  @Input() menteeName: string = '';
  @Input() menteeId: number | null = null;
  @Input() quickLinks: Array<{ label: string; route: string; icon: string }> = [
    { label: 'Dashboard', route: 'dashboard', icon: 'bi-house' },
    { label: 'Bookings', route: 'bookings', icon: 'bi-calendar-check' },
    { label: 'Search Mentors', route: 'search-mentors', icon: 'bi-search' },
    { label: 'CV Management', route: 'cv-management', icon: 'bi-file-earmark-person' },
    { label: 'Find Mentors', route: 'search-mentors', icon: 'bi-people' }
  ];

  sidebarOpen = true;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    if (!this.menteeId) {
      // Try to get menteeId from route params if not provided as input
      this.route.paramMap.subscribe(params => {
        const id = params.get('menteeId');
        if (id) {
          this.menteeId = +id;
        }
      });
    }
  }

  navigateTo(link: any) {
    // Always ensure menteeId is set
    if (!this.menteeId) {
      const id = this.route.snapshot.paramMap.get('menteeId');
      if (id) this.menteeId = +id;
    }
    if (this.menteeId) {
      const commands = ['/mentee', this.menteeId, link.route];
      // Always navigate, even if the URL is the same, by adding a dummy param
      this.router.navigate(commands, {
        queryParams: { t: Date.now() },
        queryParamsHandling: 'merge',
      }).then(() => {
        if (window.innerWidth < 768) {
          this.sidebarOpen = false;
        }
      });
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    // Clear auth token and redirect to login or home
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/login';
  }
}
