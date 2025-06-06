import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private baseUrl = 'https://localhost:7001/api/Bookings/mentee/2';

  constructor(private http: HttpClient) {}

  getAllBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/all`);
  }

  getUpcomingBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/upcoming`);
  }

  getCompletedBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/completed`);
  }
}
