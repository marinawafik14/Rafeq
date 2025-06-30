import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { menteeBookingservice } from '../../Services/menteeBooking.service';
import { MenteeLayoutComponent } from '../mentee-layout.component';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [CommonModule, MenteeLayoutComponent],
  templateUrl: './booking-details.component.html',
  styleUrls: ['./booking-details.component.css']
})
export class BookingDetailsComponent implements OnInit {
  booking: any = null;
  loading = true;
  error: string | null = null;
  showCancelModal = false;

  constructor(
    private route: ActivatedRoute,
    private menteeBookingservice: menteeBookingservice,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const menteeId = Number(this.route.snapshot.paramMap.get('menteeId'));
    const bookingId = Number(this.route.snapshot.paramMap.get('id'));
    if (bookingId) {
      this.menteeBookingservice.getBookingDetails(bookingId).subscribe({
        next: (data) => {
          console.log('Booking details API response:', data);
          // Check if menteeId from route matches menteeId from API response
          if (menteeId && data.menteeId && menteeId !== data.menteeId) {
            this.error = 'You are not authorized to view this booking.';
            this.loading = false;
            return;
          }
          this.booking = this.mapBookingResponse(data);
          this.loading = false;
        },
        error: (err) => {
          console.error('Booking details API error:', err);
          this.error = 'Failed to load booking details.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'Invalid booking ID.';
      this.loading = false;
    }
  }

  mapBookingResponse(data: any) {
    // Map API response to template structure
    const status = this.getBookingStatus(data);
    console.log('Mapped booking status:', status); // Debug log
    
    return {
      status: status,
      mentor: {
        name: data.mentorName,
        photo: 'assets/default-profile.png', // Optionally replace with real photo if available
        title: data.sessionType
      },
      date: data.startDateTime ? data.startDateTime.split('T')[0] : '',
      time: data.startDateTime ? new Date(data.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      endDateTime: data.endDateTime,
      startDateTime: data.startDateTime,
      meetUrl: data.googleMeetLink,
      payment: {
        amount: data.totalAmount,
        method: data.paymentStatus,
        status: data.paymentStatus,
        transactionId: data.bookingId
      },
      chatUrl: `/mentee/messages/${data.mentorId}`,
      review: null // You can fetch review if available
    };
  }

  getBookingStatus(data: any): string {
    console.log('Raw booking data status:', data.status); // Debug log
    
    // Check if explicitly cancelled
    if (data.status && (data.status.toLowerCase() === 'cancelled' || data.status.toLowerCase() === 'canceled')) {
      return 'Cancelled';
    }
    
    // If booking has ended, mark as completed regardless of API status
    if (data.endDateTime) {
      const endTime = new Date(data.endDateTime);
      const now = new Date();
      if (endTime <= now) {
        return 'Completed';
      }
    }
    
    // If booking has started but not ended, it's in progress (treat as upcoming)
    if (data.startDateTime) {
      const startTime = new Date(data.startDateTime);
      const now = new Date();
      if (startTime <= now) {
        return 'Upcoming'; // or 'In Progress' if you prefer
      }
    }
    
    // Default case - upcoming/scheduled
    return data.status || 'Upcoming';
  }

  // Helper method to determine if join button should be enabled
  bookingTabDate(booking: any): 'upcoming' | 'past' {
    if (!booking?.endDateTime) return 'upcoming';
    const now = new Date();
    const endTime = new Date(booking.endDateTime);
    return endTime > now ? 'upcoming' : 'past';
  }

  // Cancel booking methods
  canCancelBooking(): boolean {
    if (!this.booking) return false;
    // Can cancel if booking is upcoming and not already cancelled
    return this.bookingTabDate(this.booking) === 'upcoming' && 
           this.booking.status !== 'Cancelled';
  }

  openCancelModal() {
    this.showCancelModal = true;
  }

  closeCancelModal() {
    this.showCancelModal = false;
  }

  cancelBooking() {
    if (!this.booking) return;
    
    const bookingId = this.booking.payment?.transactionId || this.route.snapshot.paramMap.get('id');
    this.http.delete(`/api/Bookings/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
    }).subscribe({
      next: () => {
        this.booking.status = 'Cancelled';
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
