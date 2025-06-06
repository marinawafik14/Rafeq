import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenteeLayoutComponent } from '../mentee-layout.component';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [CommonModule, MenteeLayoutComponent],
  templateUrl: './booking-details.component.html',
  styleUrls: ['./booking-details.component.css']
})
export class BookingDetailsComponent {
  booking = {
    status: 'upcoming', // 'upcoming', 'completed', 'cancelled'
    mentor: {
      name: 'John Doe',
      photo: 'assets/default-profile.png',
      title: 'Senior Data Scientist',
    },
    date: '2025-06-10',
    time: '10:00 AM',
    meetUrl: 'https://meet.google.com/xyz-1234',
    payment: {
      amount: 60,
      method: 'Credit Card',
      status: 'Paid',
      transactionId: 'TXN123456789'
    },
    chatUrl: '/mentee/messages/123',
    review: {
      rating: 5,
      comment: 'Great session, learned a lot!',
      date: '2025-06-10'
    }
  };
}
