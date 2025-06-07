import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Bookings } from '../Models/Bookings';

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  constructor(private http : HttpClient) { }

BookingUrl = "https://localhost:7001/api/admin/bookings"

getAllBookings() :Observable<Bookings[]> {
 
   return this.http.get<Bookings[]>(this.BookingUrl); 
  
}

}
