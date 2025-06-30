import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { menteeBookingservice } from '../../Services/menteeBooking.service';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MenteeLayoutComponent } from '../mentee-layout.component';

@Component({
  selector: 'app-mentee-bookings',
  standalone: true,
  imports: [CommonModule, MenteeLayoutComponent],
  templateUrl: './mentee-bookings.component.html',
  styleUrls: ['./mentee-bookings.component.css']
})
export class MenteeBookingsComponent implements OnInit {
  tab: 'upcoming' | 'past' | 'all' = 'upcoming';
  search = '';
  filterStatus: string = '';
  page = 1;
  pageSize = 5;
  bookings: any[] = [];
  menteeId: number|null = null;
  
  // Properties for cancel booking modal
  bookingToCancel: any = null;
  showCancelModal = false;

  constructor(
    private menteeBookingservice: menteeBookingservice,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Get menteeId from route or token
    this.route.paramMap.subscribe(params => {
      const routeId = params.get('menteeId');
      let menteeId: number | null = routeId ? +routeId : null;
      if (!menteeId || isNaN(menteeId)) {
        const token = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1];
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            menteeId = payload.menteeId || null;
          } catch {}
        }
      }
      this.menteeId = menteeId;
      this.fetchBookingsForTab();
    });
  }

  fetchBookingsForTab() {
    if (!this.menteeId) return;
    if (this.tab === 'all') {
      this.menteeBookingservice.getAllBookings(this.menteeId).subscribe({
        next: (data) => this.bookings = data,
        error: _ => this.bookings = []
      });
    } else if (this.tab === 'upcoming') {
      this.menteeBookingservice.getUpcomingBookings(this.menteeId).subscribe({
        next: (data) => this.bookings = data,
        error: _ => this.bookings = []
      });
    } else if (this.tab === 'past') {
      this.menteeBookingservice.getCompletedBookings(this.menteeId).subscribe({
        next: (data) => this.bookings = data,
        error: _ => this.bookings = []
      });
    }
  }

  setTab(tab: 'upcoming' | 'past' | 'all') {
    this.tab = tab;
    this.page = 1;
    this.search = '';
    this.filterStatus = '';
    this.fetchBookingsForTab();
  }

  get filteredBookings() {
    let filtered = this.bookings;
    if (this.search) {
      filtered = filtered.filter(b => b.mentorName?.toLowerCase().includes(this.search.toLowerCase()));
    }
    if (this.filterStatus) {
      filtered = filtered.filter(b => b.status === this.filterStatus);
    }
    const startIdx = (this.page - 1) * this.pageSize;
    return filtered.slice(startIdx, startIdx + this.pageSize);
  }

  get totalFiltered() {
    return this.filteredBookings.length;
  }

  onSearchChange(event: Event) {
    this.search = (event.target as HTMLInputElement).value;
    this.page = 1;
  }

  onFilterChange(event: Event) {
    this.filterStatus = (event.target as HTMLSelectElement).value;
    this.page = 1;
  }

  onPageChange(page: number) {
    this.page = page;
  }

  joinBooking(booking: any) {
    // TODO: Implement join logic
    alert('Joining session for ' + booking.mentor);
  }

  cancelBooking(booking: any) {
    // TODO: Implement cancel logic
    alert('Cancelling booking for ' + booking.mentor);
  }

  reviewBooking(booking: any) {
    // TODO: Implement review logic
    alert('Reviewing session for ' + booking.mentor);
  }

  bookingTabDate(booking: any): 'upcoming' | 'past' {
    // Check if booking has ended based on endDateTime
    if (booking.endDateTime) {
      const now = new Date();
      const endTime = new Date(booking.endDateTime);
      return endTime > now ? 'upcoming' : 'past';
    }
    // Fallback to checking startDateTime if no endDateTime
    const now = new Date();
    const start = new Date(booking.startDateTime);
    return start > now ? 'upcoming' : 'past';
  }

  getBookingStatus(booking: any): string {
    // If booking has ended, mark as completed
    if (booking.endDateTime) {
      const endTime = new Date(booking.endDateTime);
      const now = new Date();
      if (endTime <= now) {
        return 'Completed';
      }
    }
    return booking.status || 'Scheduled';
  }

  getBookingById(bookingId: number) {
    return this.http.get(`/api/Bookings/${bookingId}`);
  }

  viewBookingDetails(booking: any) {
    const id = booking.bookingId || booking.id;
    if (!id || !this.menteeId) return;
    this.getBookingById(id).subscribe({
      next: (data) => {
        this.router.navigate(['/mentee', this.menteeId, 'booking-details', id]);
      },
      error: _ => {
        this.router.navigate(['/mentee', this.menteeId, 'booking-details', id]);
      }
    });
  }

  // Cancel modal methods
  confirmCancel(booking: any) {
    this.bookingToCancel = booking;
    this.showCancelModal = true;
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.bookingToCancel = null;
  }

  confirmCancelBooking() {
    if (!this.bookingToCancel || !this.menteeId) return;
    
    const bookingId = this.bookingToCancel.bookingId || this.bookingToCancel.id;
    this.http.delete(`/api/Bookings/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
    }).subscribe({
      next: () => {
        this.bookings = this.bookings.filter(b => 
          (b.bookingId || b.id) !== bookingId
        );
        this.closeCancelModal();
      },
      error: (err) => {
        console.error('Error cancelling booking:', err);
        this.closeCancelModal();
      }
    });
  }

  private getAuthToken(): string {
    return document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || '';
  }
}
