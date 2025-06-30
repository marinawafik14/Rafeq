// mentee-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { MenteeService } from '../../Services/Mentee.service';
import { AuthService } from '../../Services/auth.service';
import { menteeBookingservice } from '../../Services/menteeBooking.service';

@Component({
  selector: 'app-mentee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MenteeLayoutComponent, FormsModule],
  templateUrl: './mentee-dashboard.component.html',
  styleUrls: ['./mentee-dashboard.component.css']
})
export class MenteeDashboardComponent implements OnInit {
  menteeName: string = '';
  menteeId: number | null = null;
  stats = [
    { label: 'Total Sessions', value: 0, icon: 'bi-calendar-check', trend: 'up', change: '+12%', color: '#4f46e5' },
    { label: 'Upcoming', value: 0, icon: 'bi-clock-history', trend: 'neutral', change: '0%', color: '#f59e0b' },
    { label: 'Completed', value: 0, icon: 'bi-check-circle', trend: 'up', change: '+8%', color: '#10b981' },
    { label: 'Cancelled', value: 0, icon: 'bi-x-circle', trend: 'down', change: '-3%', color: '#ef4444' }
  ];
  upcomingSessions: any[] | undefined = undefined;
  completedSessions: any[] | undefined = undefined;
  recentActivity: any[] = [];

  // Dashboard loading state
  isLoading = true;
  
  // Pagination properties for upcoming sessions
  upcomingCurrentPage = 1;
  upcomingPageSize = 5;
  upcomingTotalPages = 1;
  upcomingTotalItems = 0;

  // Pagination properties for completed sessions  
  completedCurrentPage = 1;
  completedPageSize = 5;
  completedTotalPages = 1;
  completedTotalItems = 0;

  constructor(
    private menteeService: MenteeService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private menteeBookingservice: menteeBookingservice
  ) {}

  ngOnInit() {
    // Get menteeId from AuthService (currentUserValue)
    const user = this.authService.currentUserValue;
    this.menteeId = user && user.userId ? user.userId : null;
    if (!this.menteeId) {
      console.error('No valid menteeId found. Please log in again.');
      // Optionally redirect to login
      // this.router.navigate(['/login']);
      return;
    }
    this.loadDashboardData(this.menteeId);
  }

  loadDashboardData(menteeId: number) {
    // Use the dashboard endpoint for stats and recent activity
    this.menteeService.getDashboardData(menteeId).subscribe({
      next: (data: any) => {
        this.menteeName = data.menteeName;
        this.stats[0].value = data.stats.totalSessions;
        this.stats[1].value = data.stats.upcomingSessions;
        this.stats[2].value = data.stats.completedSessions;
        this.stats[3].value = data.stats.cancelledSessions;
        this.recentActivity = (data.recentActivities || []).map((activity: any) => ({
          type: activity.activityType,
          text: activity.text,
          date: new Date(activity.activityDate).toLocaleDateString()
        }));
      },
      error: (err: any) => {
        console.error('Failed to load dashboard data', err);
        this.menteeName = '';
        this.stats.forEach(s => s.value = 0);
        this.recentActivity = [];
      }
    });
    // Fetch upcoming sessions from /api/MenteeBookings/mentee/{menteeId}/upcoming
    this.menteeBookingservice.getUpcomingBookings(menteeId).subscribe({
      next: (sessions: any[]) => {
        this.upcomingSessions = (sessions || []).map(session => ({
          id: session.bookingId,
          mentor: session.mentorName,
          date: session.startDateTime ? new Date(session.startDateTime).toLocaleDateString() : '',
          time: session.startDateTime ? new Date(session.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          joinUrl: session.googleMeetLink,
          status: session.status,
          mentorAvatar: session.mentorAvatar || null
        }));
        this.upcomingTotalItems = this.upcomingSessions.length;
        this.updateUpcomingPagination();
        this.updateStats();
      },
      error: () => {
        this.upcomingSessions = [];
        this.upcomingTotalItems = 0;
        this.updateUpcomingPagination();
        this.updateStats();
      }
    });
    // Fetch completed sessions from /api/MenteeBookings/mentee/{menteeId}/completed
    this.menteeBookingservice.getCompletedBookings(menteeId).subscribe({
      next: (sessions: any[]) => {
        this.completedSessions = (sessions || []).map(session => ({
          id: session.bookingId,
          mentor: session.mentorName,
          date: session.startDateTime ? new Date(session.startDateTime).toLocaleDateString() : '',
          time: session.startDateTime ? new Date(session.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          status: session.status,
          rating: session.rating || null
        }));
        this.completedTotalItems = this.completedSessions.length;
        this.updateCompletedPagination();
        this.updateStats();
      },
      error: () => {
        this.completedSessions = [];
        this.completedTotalItems = 0;
        this.updateCompletedPagination();
        this.updateStats();
      }
    });
  }

  updateTotalSessions() {
    this.stats[0].value = this.stats[1].value + this.stats[2].value;
  }

  // Upcoming sessions pagination methods
  get upcomingStartItem() {
    return (this.upcomingCurrentPage - 1) * this.upcomingPageSize + 1;
  }

  get upcomingEndItem() {
    return Math.min(this.upcomingCurrentPage * this.upcomingPageSize, this.upcomingTotalItems);
  }

  updateUpcomingPagination() {
    this.upcomingTotalPages = Math.ceil(this.upcomingTotalItems / this.upcomingPageSize);
  }

  goToUpcomingPage(page: number) {
    if (page >= 1 && page <= this.upcomingTotalPages) {
      this.upcomingCurrentPage = page;
    }
  }

  onUpcomingPageSizeChange() {
    this.upcomingCurrentPage = 1;
    this.updateUpcomingPagination();
  }

  // Completed sessions pagination methods
  get completedStartItem() {
    return (this.completedCurrentPage - 1) * this.completedPageSize + 1;
  }

  get completedEndItem() {
    return Math.min(this.completedCurrentPage * this.completedPageSize, this.completedTotalItems);
  }

  updateCompletedPagination() {
    this.completedTotalPages = Math.ceil(this.completedTotalItems / this.completedPageSize);
  }

  goToCompletedPage(page: number) {
    if (page >= 1 && page <= this.completedTotalPages) {
      this.completedCurrentPage = page;
    }
  }

  onCompletedPageSizeChange() {
    this.completedCurrentPage = 1;
    this.updateCompletedPagination();
  }

  // Common pagination helper
  getPaginationRange(currentPage: number, totalPages: number): number[] {
    const range: number[] = [];
    const showPages = 3; // Show 3 pages at most
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, currentPage + 1);
    
    if (end - start < showPages - 1) {
      if (start === 1) {
        end = Math.min(totalPages, start + showPages - 1);
      } else {
        start = Math.max(1, end - showPages + 1);
      }
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }

  // Update stats with real data from session arrays
  private updateStats() {
    // Only update the upcoming and completed counts from the actual session data
    // Don't override total sessions and cancelled sessions from dashboard API
    if (this.upcomingSessions !== undefined) {
      this.stats[1].value = this.upcomingSessions.length;
    }
    if (this.completedSessions !== undefined) {
      this.stats[2].value = this.completedSessions.length;
    }
    
    // Update total sessions based on current counts
    this.stats[0].value = this.stats[1].value + this.stats[2].value + this.stats[3].value;
    
    // Set loading to false when both session arrays are loaded
    if (this.upcomingSessions !== undefined && this.completedSessions !== undefined) {
      this.isLoading = false;
    }
  }

  // Navigation methods for quick actions
  navigateToSearchMentors() {
    if (this.menteeId) {
      this.router.navigate(['/mentee', this.menteeId, 'search-mentors']);
    }
  }

  navigateToBookings() {
    if (this.menteeId) {
      this.router.navigate(['/mentee', this.menteeId, 'mentee-bookings']);
    }
  }

  navigateToProfile() {
    if (this.menteeId) {
      this.router.navigate(['/mentee', this.menteeId, 'profile']);
    }
  }

  navigateToCV() {
    if (this.menteeId) {
      this.router.navigate(['/mentee', this.menteeId, 'cv-management']);
    }
  }

  // Session actions
  joinSession(session: any) {
    if (session.joinUrl) {
      window.open(session.joinUrl, '_blank');
    }
  }

  isSessionStartingSoon(session: any): boolean {
    if (!session.date || !session.time) return false;
    
    const sessionDateTime = new Date(`${session.date} ${session.time}`);
    const now = new Date();
    const timeDiff = sessionDateTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Allow joining 15 minutes before session starts
    return minutesDiff <= 15 && minutesDiff >= -5;
  }

  // Track by functions for performance
  trackByStat(index: number, stat: any): string {
    return stat.label;
  }

  trackBySession(index: number, session: any): number {
    return session.id;
  }

  trackByActivity(index: number, activity: any): string {
    return activity.activityType + activity.activityDate;
  }

  // Get trend icon for stats
  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return 'bi-trending-up';
      case 'down': return 'bi-trending-down';
      default: return 'bi-dash';
    }
  }

  loadMenteeData(menteeId: number) {
    // Implementation for loading mentee data
  }
}