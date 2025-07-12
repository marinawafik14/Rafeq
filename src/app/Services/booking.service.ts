import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Bookings } from '../Models/Bookings';
import { SessionJoinRequest } from '../Models/Booking/session-join-request'; // Add this import
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  constructor(private http : HttpClient) { }

  BookingUrl = `${environment.apiUrl}/admin/bookings`

  getAllBookings() :Observable<Bookings[]> {
   
     return this.http.get<Bookings[]>(this.BookingUrl); 
    
  }

  updateMeetingLink(bookingId: number, meetingLink: string): Observable<any> {
    return this.http.put(`${this.BookingUrl}/${bookingId}/meeting-link`, {
      meetingLink: meetingLink
    });
  }

  joinBooking(bookingId: number): Observable<SessionJoinRequest> {
    return this.http.post<SessionJoinRequest>(`${this.BookingUrl}/${bookingId}/join`, {});
  }
}
