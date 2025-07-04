import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
  
  stats = [
    { label: 'Completed', value: 0, icon: 'bi-check-circle', color: '#10b981' },
    { label: 'Confirmed', value: 0, icon: 'bi-calendar-check', color: '#4f46e5' },
    { label: 'Cancelled', value: 0, icon: 'bi-x-circle', color: '#ef4444' },
  ];

  allBookings: any[] = [];
  completedBookings: any[] = [];
  upcomingBookings: any[] = [];
  cancelledBookings: any[] = [];
  bookingReviews: { [bookingId: number]: any } = {};

  isLoading = true;
  currentPage = 1;
  pageSize = 6;
  totalPages = 1;
  totalItems = 0;
  activeTab: string = 'confirmed';

  constructor(
    private authService: AuthService,
    private router: Router,
    private menteeBookingservice: menteeBookingservice,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const user = this.authService.currentUserValue;
    this.menteeId = user && user.userId ? user.userId : null;
    if (!this.menteeId) return;
    this.updatePagination(); // Initialize pagination
    this.loadDashboardData(this.menteeId);
  }

  loadDashboardData(menteeId: number) {
    this.isLoading = true;
    this.menteeBookingservice.getAllBookings(menteeId).subscribe({
      next: (bookings: any[]) => {
        this.allBookings = bookings || [];
        this.categorizeBookings();
        this.calculateStats();
        this.isLoading = false;
      },
      error: (err: any) => {
        this.allBookings = [];
        this.stats.forEach(s => s.value = 0);
        this.isLoading = false;
      }
    });
  }

  categorizeBookings() {
    this.completedBookings = this.allBookings.filter(booking => 
      booking.status?.toLowerCase() === 'completed'
    );
    
    this.upcomingBookings = this.allBookings.filter(booking => 
      booking.status?.toLowerCase() === 'confirmed'
    );
    
    this.cancelledBookings = this.allBookings.filter(booking => 
      booking.status?.toLowerCase() === 'cancelled'
    );

    this.updatePagination();
  }

  calculateStats() {
    this.stats[0].value = this.completedBookings.length;
    this.stats[1].value = this.upcomingBookings.length;
    this.stats[2].value = this.cancelledBookings.length;
  }

  getCurrentBookings(): any[] {
    const bookings = this.getBookingsForActiveTab();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return bookings.slice(startIndex, endIndex);
  }

  private getBookingsForActiveTab(): any[] {
    switch (this.activeTab) {
      case 'confirmed':
        return this.upcomingBookings;
      case 'completed':
        return this.completedBookings;
      case 'upcoming':
        return this.upcomingBookings;
      case 'cancelled':
        return this.cancelledBookings;
      default:
        return this.upcomingBookings;
    }
  }

  private updatePagination() {
    const bookings = this.getBookingsForActiveTab();
    this.totalItems = bookings.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.currentPage = 1;
    this.updatePagination();
  }

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

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  formatTime(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  }

  getStatusBadgeClass(status: string): string {
    if (!status) return 'status-unknown';
    
    switch (status.toLowerCase()) {
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
    
    return minutesDiff <= 5 && minutesDiff >= -60;
  }

  trackByStat(index: number, stat: any): string {
    return stat.label;
  }

  trackByBooking(index: number, booking: any): number {
    return booking.bookingId;
  }
}