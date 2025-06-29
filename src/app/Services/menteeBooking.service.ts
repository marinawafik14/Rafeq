import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  // // Add booking creation for mentee
  // createBooking(booking: {
  //   mentorId: number;
  //   sessionType: string;
  //   startDateTime: string;
  //   endDateTime: string;
  // }): Observable<any> {
  //   // Use relative URL so proxy works
  //   return this.http.post('/api/MenteeBookings', booking);
  // }

  // Get booking details by bookingId
  getBookingDetails(bookingId: number): Observable<any> {
    return this.http.get<any>(`https://localhost:7001/api/MenteeBookings/${bookingId}`);
  }

  createBookingForMentee(menteeId: number, mentorId: number, booking: {
    sessionType: string;
    startDateTime: string;
    endDateTime: string;
  }): Observable<any> {
    return this.http.post(`/api/MenteeBookings/mentee/${menteeId}/bookings?mentorId=${mentorId}`, booking);
  }

  // Cancel booking by ID
  cancelBooking(bookingId: number): Observable<any> {
    return this.http.delete(`https://localhost:7001/api/MenteeBookings/${bookingId}`);
  }
}