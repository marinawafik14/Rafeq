import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bookings } from '../Models/Bookings';

@Injectable({ providedIn: 'root' })
export class menteeBookingservice {
  private baseUrl = 'https://localhost:7001/api/MenteeBookings/mentee';

  constructor(private http: HttpClient) {}

  getAllBookings(menteeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${menteeId}/all`);
  }

  getUpcomingBookings(menteeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${menteeId}/upcoming`);
  }

  getCompletedBookings(menteeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${menteeId}/completed`);
  }

  // Get booking details by bookingId
  getBookingDetails(bookingId: number): Observable<any> {
    return this.http.get<any>(`https://localhost:7001/api/MenteeBookings/${bookingId}`);
  }
  createBookingForMentee(menteeId: number, bookingData: any): Observable<any> {
    const requestBody = {
      mentorId: bookingData.mentorId || bookingData.MentorId,
      sessionType: bookingData.sessionType,
      startDateTime: bookingData.startDateTime,
      endDateTime: bookingData.endDateTime,
      totalAmount: bookingData.totalAmount // ✅ Add this back
    };
    
    return this.http.post<any>(
      `https://localhost:7001/api/MenteeBookings/mentee/${menteeId}`,
      requestBody
    );
}
 // Cancel a booking (returns observable)
  cancelBooking(bookingId: number): Observable<any> {
    return this.http.post<any>(`https://localhost:7001/api/MenteeBookings/${bookingId}/cancel`, {});
  }

  // Cancel pending booking and clear session (returns a Promise for async/await usage)
  async cancelPendingBookingAndFreeSlot(): Promise<void> {
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (pendingBooking) {
      try {
        const booking = JSON.parse(pendingBooking);
        if (booking.bookingId) {
          await this.cancelBooking(booking.bookingId).toPromise();
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    sessionStorage.removeItem('pendingBooking');
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('booking_') && key.endsWith('_amount')) {
        sessionStorage.removeItem(key);
      }
    });
  }
  
}