import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment.development';
import { MentorBooking } from '../Models/Mentor/MentorBooking';
import { MentorEarnings } from '../Models/Mentor/MentorEarnings';

@Injectable({
  providedIn: 'root'
})
export class MentorService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get mentor's bookings
  getMentorBookings(mentorId: number): Observable<MentorBooking[]> {
    return this.http.get<{success: boolean, data: MentorBooking[]}>(`${this.apiUrl}/bookings/mentor/${mentorId}`)
      .pipe(
        map(response => response.data)
      );
  }

  // Get upcoming sessions for the mentor
  getUpcomingBookings(mentorId: number): Observable<MentorBooking[]> {
    return this.http.get<{success: boolean, data: MentorBooking[]}>(`${this.apiUrl}/bookings/mentor/${mentorId}?status=upcoming`)
      .pipe(
        map(response => response.data)
      );
  }

  // Get mentor's earnings summary
  getMentorEarnings(): Observable<MentorEarnings> {
    return this.http.get<{success: boolean, data: MentorEarnings}>(`${this.apiUrl}/payments/mentor-earnings`)
      .pipe(
        map(response => response.data)
      );
  }

  // Update mentor availability status
  updateMentorStatus(isAvailable: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/toggle-mentor-status`, { isAvailable });
  }

  // Get today's sessions
  getTodaySessions(mentorId: number): Observable<MentorBooking[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.http.get<{success: boolean, data: MentorBooking[]}>(`${this.apiUrl}/bookings/mentor/${mentorId}?date=${today}`)
      .pipe(
        map(response => response.data)
      );
  }

  // Get mentor's earnings summary (mocked data)
  getMentorEarningsSummary(): Observable<any> {
    return new Observable(observer => {
      observer.next({
        totalEarnings: 1000,
        completedSessions: 11,
        upcomingSessions: 19,
        pendingBookings: 5
      });
      observer.complete();
    });
  }
}