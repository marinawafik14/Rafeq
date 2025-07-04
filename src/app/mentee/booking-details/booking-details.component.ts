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
  bookingReview: any = null;
  loadingReview = false;

  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  private toastTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private menteeBookingservice: menteeBookingservice,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const menteeId = this.authService.getCurrentUserId();
    const bookingId = Number(this.route.snapshot.paramMap.get('id'));
    
    if (bookingId) {
      this.menteeBookingservice.getBookingDetails(bookingId).subscribe({
        next: (data) => {
          if (menteeId && data.menteeId && menteeId !== data.menteeId) {
            this.error = 'You are not authorized to view this booking.';
            this.loading = false;
            return;
          }
          this.booking = this.mapBookingResponse(data);
          this.loadBookingReview(bookingId);
          this.loading = false;
        },
        error: (err) => {
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
    const status = this.getBookingStatus(data);
    
    let meetUrl = data.googleMeetLink || null;
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
      meetUrl: meetUrl,
      payment: {
        amount: data.totalAmount || 0,
        method: data.paymentMethod || data.paymentStatus || 'Not specified',
        status: data.paymentStatus || 'Unpaid',
        transactionId: data.transactionId || `Booking #${data.bookingId}`
      },
      chatUrl: `/mentee/messages/${data.mentorId}`,
      review: null,
      rawData: data
    };
  }

  private loadBookingReview(bookingId: number): void {
    const menteeId = this.authService.getCurrentUserId();
    if (!menteeId) return;

    this.loadingReview = true;
    
    // First try to fetch review by booking ID directly
    this.http.get<any>(`https://localhost:7001/api/mentee-reviews/booking/${bookingId}`).subscribe({
      next: (review) => {
        if (review) {
          this.bookingReview = {
            id: review.reviewId || review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt || review.reviewDate,
            canEdit: true
          };
          this.booking.review = this.bookingReview;
        }
        this.loadingReview = false;
      },
      error: (err) => {
        // Fallback: fetch all reviews for this mentee and find the one for this booking
        this.http.get<any[]>(`https://localhost:7001/api/mentee-reviews/mentee/${menteeId}`).subscribe({
          next: (reviews) => {
            const bookingReview = reviews.find(review => review.bookingId === bookingId);
            if (bookingReview) {
              this.bookingReview = {
                id: bookingReview.reviewId || bookingReview.id,
                rating: bookingReview.rating,
                comment: bookingReview.comment,
                createdAt: bookingReview.createdAt || bookingReview.reviewDate,
                canEdit: true
              };
              this.booking.review = this.bookingReview;
            }
            this.loadingReview = false;
          },
          error: (fallbackErr) => {
            this.loadingReview = false;
          }
        });
      }
    });
  }

  getBookingStatus(data: any): string {
    if (!data.status) {
      return 'Unknown';
    }
    
    const status = data.status.toLowerCase();
    
    if (status === 'cancelled' || status === 'canceled') {
      return 'Cancelled';
    }
    
    if (status === 'completed') {
      return 'Completed';
    }
    
    if (status === 'confirmed') {
      return 'Confirmed';
    }
    
    if (status === 'upcoming' || status === 'pending' || status === 'scheduled') {
      return 'Upcoming';
    }
    
    if (data.endDateTime) {
      const endTime = new Date(data.endDateTime);
      const now = new Date();
      if (endTime <= now) {
        return 'Completed';
      }
    }
    
    if (data.startDateTime) {
      const startTime = new Date(data.startDateTime);
      const endTime = data.endDateTime ? new Date(data.endDateTime) : null;
      const now = new Date();
      
      if (startTime <= now && (endTime === null || endTime > now)) {
        return 'Confirmed';
      }
      
      if (startTime > now) {
        return 'Upcoming';
      }
    }
    
    return data.status || 'Upcoming';
  }

  canCancelBooking(): boolean {
    if (!this.booking) return false;
    
    const status = (this.booking.status || '').toLowerCase();
    if (['completed', 'cancelled', 'canceled'].includes(status)) {
      return false;
    }
    
    if (!this.booking.startDateTime) return false;
    
    const now = new Date();
    const startTime = new Date(this.booking.startDateTime);
    
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
      this.closeCancelModal();
      return;
    }
    
    this.menteeBookingservice.cancelBooking(Number(bookingId)).subscribe({
      next: () => {
        this.booking.status = 'Cancelled';
        this.closeCancelModal();
        this.error = null;
        this.showToaster('Booking cancelled successfully', 'success');
      },
      error: (err) => {
        this.closeCancelModal();
        this.error = 'Failed to cancel booking. Please try again.';
        this.showToaster('Failed to cancel booking. Please try again.', 'error');
      }
    });
  }

  canJoinSession(booking: any): boolean {
    if (!booking || !booking.meetUrl || !booking.meetUrl.trim()) {
      return false;
    }
    
    const status = (booking.status || '').toLowerCase();
    if (!['confirmed', 'upcoming', 'scheduled'].includes(status)) {
      return false;
    }
    
    if (!booking.startDateTime) {
      return false;
    }
    
    const now = new Date();
    const startTime = new Date(booking.startDateTime);
    
    const nowUTC = new Date(Date.UTC(
      now.getUTCFullYear(), 
      now.getUTCMonth(), 
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes()
    ));
    
    const timeDiff = startTime.getTime() - nowUTC.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    return minutesDiff <= 5 && minutesDiff >= -60;
  }
  
  getJoinTimeMessage(booking: any): string {
    if (!booking || !booking.startDateTime) return '';
    
    const now = new Date();
    const startTime = new Date(booking.startDateTime);
    
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
      return '(session expired)';
    } else {
      return 'now';
    }
  }

  formatTime(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  }

  joinSession() {
    if (!this.booking || !this.booking.meetUrl || !this.booking.meetUrl.trim()) {
      this.error = 'Meeting link is not available for this session.';
      return;
    }
    
    if (!this.canJoinSession(this.booking)) {
      this.error = `You can only join the session ${this.getJoinTimeMessage(this.booking)}.`;
      return;
    }
    
    window.open(this.booking.meetUrl, '_blank');
  }
  
  showToaster(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.hideToaster();
    }, 4000);
  }

  hideToaster() {
    this.showToast = false;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
  }

  hasReview(): boolean {
    return this.bookingReview !== null;
  }

  canWriteReview(): boolean {
    if (!this.booking) return false;
    
    const status = (this.booking.status || '').toLowerCase();
    if (!['completed', 'finished'].includes(status)) {
      return false;
    }
    
    return !this.hasReview();
  }

  // getStarArray(rating: number): boolean[] {
  //   const stars = [];
  //   for (let i = 1; i <= 5; i++) {
  //     stars.push(i <= Math.floor(rating));
  //   }
  //   return stars;
  // }

  formatReviewDate(dateString: string): string {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid Date';
    }
  }

  refreshReview(): void {
    const bookingId = Number(this.route.snapshot.paramMap.get('id'));
    if (bookingId) {
      this.loadBookingReview(bookingId);
    }
  }
}
