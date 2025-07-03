import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { menteeBookingservice } from '../../Services/menteeBooking.service';
import { MenteeLayoutComponent } from '../mentee-layout.component';
import { AuthService } from '../../Services/auth.service';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [CommonModule, MenteeLayoutComponent, RouterModule],
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
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Get menteeId from AuthService
    const menteeId = this.authService.getCurrentUserId();
    
    const bookingId = Number(this.route.snapshot.paramMap.get('id'));
    if (bookingId) {
      this.menteeBookingservice.getBookingDetails(bookingId).subscribe({
        next: (data) => {
          console.log('Booking details API response:', data);
          // Check if menteeId from AuthService matches menteeId from API response
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
    console.log('Google Meet Link:', data.googleMeetLink); // Debug log
    
    // Ensure Google Meet link is properly formatted
    let meetUrl = data.googleMeetLink || null;
    
    // If the URL exists but doesn't have the protocol, add it
    if (meetUrl && meetUrl.trim() && !meetUrl.startsWith('http')) {
      meetUrl = 'https://' + meetUrl.trim();
    }
    
    return {
      status: status,
      mentor: {
        name: data.mentorName,
        photo: data.mentorPhoto || 'assets/default-profile.png',
        title: data.sessionType || 'Mentoring Session'
      },
      date: data.startDateTime ? data.startDateTime.split('T')[0] : '',
      time: data.startDateTime && data.endDateTime ? 
            `${this.formatTime(data.startDateTime)} - ${this.formatTime(data.endDateTime)}` : '',
      endDateTime: data.endDateTime,
      startDateTime: data.startDateTime,
      meetUrl: meetUrl, // Use the processed Google Meet link
      payment: {
        amount: data.totalAmount || 0,
        method: data.paymentMethod || data.paymentStatus || 'Not specified',
        status: data.paymentStatus || 'Unpaid',
        transactionId: data.transactionId || `Booking #${data.bookingId}`
      },
      chatUrl: `/mentee/messages/${data.mentorId}`,
      review: null, // You can fetch review if available
      rawData: data // Keep raw data for debugging
    };
  }

  getBookingStatus(data: any): string {
    console.log('Raw booking data status:', data.status); // Debug log
    
    // If there's no status, default to unknown
    if (!data.status) {
      return 'Unknown';
    }
    
    // First, handle direct status matches
    const status = data.status.toLowerCase();
    
    // Check for cancelled status
    if (status === 'cancelled' || status === 'canceled') {
      return 'Cancelled';
    }
    
    // Check for completed status
    if (status === 'completed') {
      return 'Completed';
    }
    
    // Check for confirmed status
    if (status === 'confirmed') {
      return 'Confirmed';
    }
    
    // Check for upcoming/pending/scheduled status
    if (status === 'upcoming' || status === 'pending' || status === 'scheduled') {
      return 'Upcoming';
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
      const endTime = data.endDateTime ? new Date(data.endDateTime) : null;
      const now = new Date();
      
      if (startTime <= now && (endTime === null || endTime > now)) {
        return 'Confirmed'; // In progress, but we'll call it Confirmed for UI purposes
      }
      
      // Future booking
      if (startTime > now) {
        return 'Upcoming';
      }
    }
    
    // Default case - keep original capitalization
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
    
    // Can only cancel if status is pending or upcoming (not completed or cancelled)
    const status = (this.booking.status || '').toLowerCase();
    if (['completed', 'cancelled', 'canceled'].includes(status)) {
      return false;
    }
    
    // Make sure booking is in the future (not in the past)
    if (!this.booking.startDateTime) return false;
    
    // Calculate using UTC time to match API
    const now = new Date();
    const startTime = new Date(this.booking.startDateTime);
    
    // Ensure we're comparing in the same timezone (UTC)
    const nowUTC = new Date(Date.UTC(
      now.getUTCFullYear(), 
      now.getUTCMonth(), 
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes()
    ));
    
    return startTime > nowUTC;
  }

  openCancelModal() {
    this.showCancelModal = true;
  }

  closeCancelModal() {
    this.showCancelModal = false;
  }

  cancelBooking() {
    if (!this.booking) return;
    
    const bookingId = this.route.snapshot.paramMap.get('id');
    if (!bookingId) {
      console.error('Booking ID not found');
      this.closeCancelModal();
      return;
    }
    
    // Use the correct API endpoint from the service
    this.menteeBookingservice.cancelBooking(Number(bookingId)).subscribe({
      next: () => {
        this.booking.status = 'Cancelled';
        this.closeCancelModal();
        // Show success message
        this.error = null;
        alert('Booking cancelled successfully');
      },
      error: (err) => {
        console.error('Error cancelling booking:', err);
        this.closeCancelModal();
        // Show error message
        this.error = 'Failed to cancel booking. Please try again.';
      }
    });
  }

  // Check if the session can be joined
  canJoinSession(booking: any): boolean {
    // Make sure booking exists and has a valid Google Meet link
    if (!booking || !booking.meetUrl || !booking.meetUrl.trim()) {
      return false;
    }
    
    // Status check - only confirmed/upcoming sessions can be joined
    const status = (booking.status || '').toLowerCase();
    if (!['confirmed', 'upcoming', 'scheduled'].includes(status)) {
      return false;
    }
    
    // Time window check
    if (!booking.startDateTime) {
      return false;
    }
    
    // Calculate time difference using UTC time to match the API
    const now = new Date();
    const startTime = new Date(booking.startDateTime);
    
    // Ensure we're comparing in the same timezone (UTC)
    const nowUTC = new Date(Date.UTC(
      now.getUTCFullYear(), 
      now.getUTCMonth(), 
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes()
    ));
    
    const timeDiff = startTime.getTime() - nowUTC.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Can join only 5 minutes before session start and up to 60 minutes after start time
    return minutesDiff <= 5 && minutesDiff >= -60;
    
    // For testing only - always allow joining if status and link are valid
    // return true;
  }
  
  // Get user-friendly message about when the session can be joined
  getJoinTimeMessage(booking: any): string {
    if (!booking || !booking.startDateTime) return '';
    
    // Calculate time difference using UTC time to match the API
    const now = new Date();
    const startTime = new Date(booking.startDateTime);
    
    // Ensure we're comparing in the same timezone (UTC)
    const nowUTC = new Date(Date.UTC(
      now.getUTCFullYear(), 
      now.getUTCMonth(), 
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes()
    ));
    
    const timeDiff = startTime.getTime() - nowUTC.getTime();
    const minutesDiff = Math.round(timeDiff / (1000 * 60));
    
    if (minutesDiff > 5) {
      // Session in future, but more than 5 minutes away
      const days = Math.floor(minutesDiff / (60 * 24));
      const hours = Math.floor((minutesDiff % (60 * 24)) / 60);
      const minutes = minutesDiff % 60;
      
      if (days > 0) {
        return `in ${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `in ${hours}h ${minutes}m`;
      } else {
        return `in ${minutes}m`;
      }
    } else if (minutesDiff < -60) {
      // Session too far in past
      return '(session expired)';
    } else {
      // Should be able to join now
      return 'now';
    }
  }

  private getAuthToken(): string {
    return document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || '';
  }

  // Format time in UTC to match the API's time format
  formatTime(dateString: string): string {
    if (!dateString) return 'N/A';
    
    // Explicitly handle the timezone by specifying timeZone: 'UTC'
    // This prevents browser's local timezone from affecting the display
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'  // Display in UTC to match API's time
    });
  }

  // Join the session by opening the Google Meet link in a new tab
  joinSession() {
    if (!this.booking || !this.booking.meetUrl || !this.booking.meetUrl.trim()) {
      this.error = 'Meeting link is not available for this session.';
      return;
    }
    
    if (!this.canJoinSession(this.booking)) {
      this.error = `You can only join the session ${this.getJoinTimeMessage(this.booking)}.`;
      return;
    }
    
    // Open the Google Meet link in a new tab
    window.open(this.booking.meetUrl, '_blank');
  }
  
  // Helper method for debugging - remove in production
  debugBooking() {
    console.log('Booking Details:', this.booking);
    console.log('Raw Data:', this.booking?.rawData);
    console.log('Meet URL:', this.booking?.meetUrl);
    console.log('Status:', this.booking?.status);
    console.log('Start Time:', this.booking?.startDateTime);
    
    if (this.booking?.startDateTime) {
      const now = new Date();
      const startTime = new Date(this.booking.startDateTime);
      
      // Ensure we're comparing in the same timezone (UTC)
      const nowUTC = new Date(Date.UTC(
        now.getUTCFullYear(), 
        now.getUTCMonth(), 
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes()
      ));
      
      const timeDiff = startTime.getTime() - nowUTC.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      console.log('Minutes until session:', minutesDiff);
      console.log('Can join? (needs to be within 5 min before start and 60 min after):', this.canJoinSession(this.booking));
    }
    
    // For UI testing/debugging only - use alert to show info on screen
    alert(`
      Status: ${this.booking?.status}
      Meet URL: ${this.booking?.meetUrl || 'None'}
      Can Join: ${this.canJoinSession(this.booking)}
      Can Cancel: ${this.canCancelBooking()}
    `);
  }
}
