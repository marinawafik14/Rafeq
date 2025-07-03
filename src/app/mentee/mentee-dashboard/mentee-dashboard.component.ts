// mentee-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { AuthService } from '../../Services/auth.service';
import { menteeBookingservice } from '../../Services/menteeBooking.service';

@Component({
  selector: 'app-mentee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mentee-dashboard.component.html',
  styleUrls: ['./mentee-dashboard.component.css']
})
export class MenteeDashboardComponent implements OnInit {
  menteeName: string = '';
  menteeId: number | null = null;
  
  // Statistics for the 5 cards
  stats = [
    { label: 'Pending', value: 0, icon: 'bi-clock-history', color: '#f59e0b' },
    { label: 'Completed', value: 0, icon: 'bi-check-circle', color: '#10b981' },
    { label: 'Confirmed', value: 0, icon: 'bi-calendar-check', color: '#4f46e5' },
    { label: 'Cancelled', value: 0, icon: 'bi-x-circle', color: '#ef4444' },
    { label: 'Total', value: 0, icon: 'bi-calendar-week', color: '#6366f1' }
  ];

  // All bookings from API
  allBookings: any[] = [];
  
  // Categorized bookings for cards
  pendingBookings: any[] = [];
  completedBookings: any[] = [];
  upcomingBookings: any[] = [];
  cancelledBookings: any[] = [];

  // Dashboard loading state
  isLoading = true;
  
  // Pagination properties
  currentPage = 1;
  pageSize = 6;
  totalPages = 1;
  totalItems = 0;
  
  // Active tab for displaying different booking categories
  activeTab: string = 'pending';

  constructor(
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
      return;
    }
    this.loadDashboardData(this.menteeId);
  }

  loadDashboardData(menteeId: number) {
    this.isLoading = true;
    
    // Fetch all bookings from the new endpoint
    this.menteeBookingservice.getAllBookings(menteeId).subscribe({
      next: (bookings: any[]) => {
        this.allBookings = bookings || [];
        this.categorizeBookings();
        this.calculateStats();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load dashboard data', err);
        this.allBookings = [];
        this.stats.forEach(s => s.value = 0);
        this.isLoading = false;
      }
    });
  }

  categorizeBookings() {
    this.pendingBookings = this.allBookings.filter(booking => 
      booking.status?.toLowerCase() === 'pending'
    );
    
    this.completedBookings = this.allBookings.filter(booking => 
      booking.status?.toLowerCase() === 'completed'
    );
    
    this.upcomingBookings = this.allBookings.filter(booking => 
      booking.status?.toLowerCase() === 'confirmed'
    );
    
    this.cancelledBookings = this.allBookings.filter(booking => 
      booking.status?.toLowerCase() === 'cancelled'
    );
  }

  isUpcoming(startDateTime: string): boolean {
    if (!startDateTime) return false;
    const sessionDate = new Date(startDateTime);
    const now = new Date();
    return sessionDate > now;
  }

  calculateStats() {
    this.stats[0].value = this.pendingBookings.length; // Pending
    this.stats[1].value = this.completedBookings.length; // Completed
    this.stats[2].value = this.upcomingBookings.length; // Confirmed
    this.stats[3].value = this.cancelledBookings.length; // Cancelled
    this.stats[4].value = this.allBookings.length; // Total
  }

  // Get bookings for current tab and page
  getCurrentBookings(): any[] {
    let bookings: any[] = [];
    
    switch (this.activeTab) {
      case 'pending':
        bookings = this.pendingBookings;
        break;
      case 'completed':
        bookings = this.completedBookings;
        break;
      case 'upcoming':
        bookings = this.upcomingBookings;
        break;
      case 'cancelled':
        bookings = this.cancelledBookings;
        break;
      default:
        bookings = this.allBookings;
    }
    
    this.totalItems = bookings.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    
    return bookings.slice(startIndex, endIndex);
  }

  // Tab management
  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.currentPage = 1;
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get startItem() {
    return Math.min((this.currentPage - 1) * this.pageSize + 1, this.totalItems);
  }

  get endItem() {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  getPaginationRange(): number[] {
    const range: number[] = [];
    const showPages = 3;
    let start = Math.max(1, this.currentPage - 1);
    let end = Math.min(this.totalPages, this.currentPage + 1);
    
    if (end - start < showPages - 1) {
      if (start === 1) {
        end = Math.min(this.totalPages, start + showPages - 1);
      } else {
        start = Math.max(1, end - showPages + 1);
      }
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }

  // Utility methods
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  formatTime(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getStatusBadgeClass(status: string): string {
    if (!status) return 'status-unknown';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'confirmed':
        return 'status-confirmed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-unknown';
    }
  }

  // Navigation methods
  navigateToSearchMentors() {
    if (this.menteeId) {
      this.router.navigate(['/mentee/search-mentors']);
    }
  }

  navigateToBookings() {
    if (this.menteeId) {
      this.router.navigate(['/mentee/bookings']);
    }
  }

  // Session actions
  joinSession(booking: any) {
    if (booking.googleMeetLink) {
      window.open(booking.googleMeetLink, '_blank');
    }
  }

  canJoinSession(booking: any): boolean {
    if (!booking.googleMeetLink || booking.status?.toLowerCase() !== 'confirmed') {
      return false;
    }
    
    if (!booking.startDateTime) return false;
    
    const sessionDateTime = new Date(booking.startDateTime);
    const now = new Date();
    const timeDiff = sessionDateTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Allow joining 15 minutes before session starts and up to session end time
    return minutesDiff <= 15 && minutesDiff >= -60; // Allow joining during the session
  }

  // Track by functions for performance
  trackByStat(index: number, stat: any): string {
    return stat.label;
  }

  trackByBooking(index: number, booking: any): number {
    return booking.bookingId;
  }

  loadMenteeData(menteeId: number) {
    // Implementation for loading mentee data
  }
}