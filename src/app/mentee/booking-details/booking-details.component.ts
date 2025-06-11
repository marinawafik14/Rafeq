import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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

  constructor(
    private route: ActivatedRoute,
    private menteeBookingservice: menteeBookingservice
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
    return {
      status: data.status,
      mentor: {
        name: data.mentorName,
        photo: 'assets/default-profile.png', // Optionally replace with real photo if available
        title: data.sessionType
      },
      date: data.startDateTime ? data.startDateTime.split('T')[0] : '',
      time: data.startDateTime ? new Date(data.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
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
}
