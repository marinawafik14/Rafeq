import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment.development';
import { MentorBookingDetails } from '../Models/Booking/mentor-booking-details';
import { BookingFilter } from '../Models/Booking/booking-filter';
import { BookingStatusUpdate } from '../Models/Booking/booking-status-update';
import { SessionJoinRequest } from '../Models/Booking/session-join-request';
import { BookingStats } from '../Models/Booking/booking-stats';
import { BookingAction } from '../Models/Booking/booking-action';

@Injectable({
  providedIn: 'root'
})
export class MentorBookingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

 
  getBookingById(bookingId: number): Observable<MentorBookingDetails> {
    return this.http.get<{success: boolean, data: MentorBookingDetails}>(`${this.apiUrl}/bookings/${bookingId}`)
      .pipe(
        map(response => response.data)
      );
  }

  getMentorBookings(mentorId: number, filter?: BookingFilter): Observable<MentorBookingDetails[]> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.status) params = params.set('status', filter.status);
      if (filter.sessionType) params = params.set('sessionType', filter.sessionType);
      if (filter.menteeName) params = params.set('menteeName', filter.menteeName);
      if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom.toISOString());
      if (filter.dateTo) params = params.set('dateTo', filter.dateTo.toISOString());
      if (filter.paymentStatus) params = params.set('paymentStatus', filter.paymentStatus);
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.sortOrder) params = params.set('sortOrder', filter.sortOrder);
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
    }

    return this.http.get<{success: boolean, data: MentorBookingDetails[]}>(`${this.apiUrl}/bookings/mentor/${mentorId}`, { params })
      .pipe(
        map(response => response.data)
      );
  }


  getUpcomingBookings(): Observable<MentorBookingDetails[]> {
    return this.http.get<{success: boolean, data: MentorBookingDetails[]}>(`${this.apiUrl}/bookings/upcoming`)
      .pipe(
        map(response => response.data)
      );
  }

  
  getCompletedBookings(): Observable<MentorBookingDetails[]> {
    return this.http.get<{success: boolean, data: MentorBookingDetails[]}>(`${this.apiUrl}/bookings/completed`)
      .pipe(
        map(response => response.data)
      );
  }


  joinBooking(bookingId: number): Observable<SessionJoinRequest> {
    return this.http.post<SessionJoinRequest>(`${this.apiUrl}/bookings/${bookingId}/join`, {});
  }


  updateBookingStatus(bookingId: number, statusUpdate: BookingStatusUpdate): Observable<MentorBookingDetails> {
    return this.http.put<{success: boolean, data: MentorBookingDetails}>(`${this.apiUrl}/bookings/${bookingId}/status`, statusUpdate)
      .pipe(
        map(response => response.data)
      );
  }


  rescheduleBooking(bookingId: number, startDateTime: Date, endDateTime: Date): Observable<MentorBookingDetails> {
    const rescheduleData = {
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString()
    };
    
    return this.http.put<{success: boolean, data: MentorBookingDetails}>(`${this.apiUrl}/bookings/${bookingId}/reschedule`, rescheduleData)
      .pipe(
        map(response => response.data)
      );
  }


  updateMeetingLink(bookingId: number, meetingLink: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/bookings/${bookingId}/meeting-link`, {
      meetingLink: meetingLink
    });
  }

 
  getAvailableActions(booking: MentorBookingDetails): BookingAction[] {
    const actions: BookingAction[] = [];
    const now = new Date();
    const sessionStart = new Date(booking.startDateTime);
    const sessionEnd = new Date(booking.endDateTime);
    const minutesUntilStart = (sessionStart.getTime() - now.getTime()) / (1000 * 60);

    switch (booking.status.toLowerCase()) {
      case 'pending':
        actions.push({
          type: 'confirm',
          label: 'Confirm',
          icon: 'fas fa-check',
          cssClass: 'btn-success',
          enabled: true
        });
        actions.push({
          type: 'cancel',
          label: 'Decline',
          icon: 'fas fa-times',
          cssClass: 'btn-outline-danger',
          enabled: true
        });
        break;

      case 'confirmed':
        
        if (minutesUntilStart <= 15 && minutesUntilStart >= -60) {
          actions.push({
            type: 'join',
            label: 'Join Session',
            icon: 'fas fa-video',
            cssClass: 'btn-primary',
            enabled: !!booking.googleMeetLink
          });
        }
        
      
        if (minutesUntilStart > 1440) {
          actions.push({
            type: 'cancel',
            label: 'Cancel',
            icon: 'fas fa-times',
            cssClass: 'btn-outline-danger',
            enabled: true
          });
        }

       
        if (minutesUntilStart > 1440) {
          actions.push({
            type: 'reschedule',
            label: 'Reschedule',
            icon: 'fas fa-calendar-alt',
            cssClass: 'btn-outline-secondary',
            enabled: true
          });
        }

    
        if (now > sessionEnd) {
          actions.push({
            type: 'complete',
            label: 'Mark Complete',
            icon: 'fas fa-check-circle',
            cssClass: 'btn-success',
            enabled: true
          });
        }
        break;

      case 'inprogress':
        actions.push({
          type: 'join',
          label: 'Rejoin Session',
          icon: 'fas fa-video',
          cssClass: 'btn-primary',
          enabled: !!booking.googleMeetLink
        });
        actions.push({
          type: 'complete',
          label: 'End Session',
          icon: 'fas fa-stop',
          cssClass: 'btn-success',
          enabled: true
        });
        break;

      case 'completed':
      case 'cancelled':
     
        break;
    }

  
    actions.push({
      type: 'view',
      label: 'View Details',
      icon: 'fas fa-eye',
      cssClass: 'btn-outline-info',
      enabled: true
    });

    return actions;
  }


  getBookingStats(bookings: MentorBookingDetails[]): BookingStats {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return {
      totalBookings: bookings.length,
      upcomingBookings: bookings.filter(b => 
        new Date(b.startDateTime) > now && 
        (b.status === 'Confirmed' || b.status === 'Pending')
      ).length,
      completedBookings: bookings.filter(b => b.status === 'Completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'Cancelled').length,
      pendingBookings: bookings.filter(b => b.status === 'Pending').length,
      totalEarnings: bookings
        .filter(b => b.status === 'Completed' && b.paymentStatus === 'Paid')
        .reduce((sum, b) => sum + (b.totalAmount - (b.commission || 0)), 0),
      thisMonthEarnings: bookings
        .filter(b => 
          b.status === 'Completed' && 
          b.paymentStatus === 'Paid' && 
          new Date(b.startDateTime) >= thisMonth
        )
        .reduce((sum, b) => sum + (b.totalAmount - (b.commission || 0)), 0)
    };
  }


  formatDateTime(dateTime: Date | string): string {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }


  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'badge bg-warning text-dark';
      case 'confirmed': return 'badge bg-info text-white';
      case 'inprogress': return 'badge bg-primary text-white';
      case 'completed': return 'badge bg-success text-white';
      case 'cancelled': return 'badge bg-danger text-white';
      default: return 'badge bg-secondary text-white';
    }
  }


  getPaymentStatusBadgeClass(paymentStatus: string): string {
    switch (paymentStatus.toLowerCase()) {
      case 'paid': return 'badge bg-success text-white';
      case 'unpaid': return 'badge bg-warning text-dark';
      default: return 'badge bg-secondary text-white';
    }
  }

  
  canJoinBooking(booking: MentorBookingDetails): boolean {
    const now = new Date();
    const sessionStart = new Date(booking.startDateTime);
    const sessionEnd = new Date(booking.endDateTime);
    const minutesUntilStart = (sessionStart.getTime() - now.getTime()) / (1000 * 60);
    
    return (booking.status === 'Confirmed' || booking.status === 'InProgress') &&
           !!booking.googleMeetLink &&
           minutesUntilStart <= 15 &&
           now < sessionEnd;
  }


  getTimeUntilSession(booking: MentorBookingDetails): string {
    const now = new Date();
    const sessionStart = new Date(booking.startDateTime);
    const diff = sessionStart.getTime() - now.getTime();
    
    if (diff <= 0) return 'Session started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }


  shouldAutoComplete(booking: MentorBookingDetails): boolean {
    const now = new Date();
    const sessionEnd = new Date(booking.endDateTime);
    
  
    return (booking.status === 'InProgress' || booking.status === 'Confirmed') && now > sessionEnd;
  }

  
  processBookingStatuses(bookings: MentorBookingDetails[]): Observable<MentorBookingDetails[]> {
    const now = new Date();
    const updatedBookings: MentorBookingDetails[] = [];
    const updatePromises: Observable<MentorBookingDetails>[] = [];
    
    bookings.forEach(booking => {
      if (this.shouldAutoComplete(booking)) {
        console.log(`Auto-completing booking ${booking.bookingId} that ended at ${booking.endDateTime}`);
        
       
        const localUpdatedBooking = { ...booking, status: 'Completed' as const };
        updatedBookings.push(localUpdatedBooking);
        
      
        const updateObservable = this.updateBookingStatus(booking.bookingId, { status: 'Completed' });
        updatePromises.push(updateObservable);
      } else {
        updatedBookings.push(booking);
      }
    });
    
    
    if (updatePromises.length > 0) {
     
      updatePromises.forEach(update => {
        update.subscribe({
          next: (updatedBooking) => console.log(`Successfully auto-completed booking ${updatedBooking.bookingId}`),
          error: (error) => console.error(`Failed to auto-complete booking:`, error)
        });
      });
    }
    
    return of(updatedBookings);
  }
}
