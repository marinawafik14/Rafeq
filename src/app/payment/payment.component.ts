import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent implements OnInit {
  bookingData: any = null;
  menteeId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Get menteeId from route parameters
    this.route.paramMap.subscribe(params => {
      const menteeId = params.get('menteeId');
      this.menteeId = menteeId ? +menteeId : null;
    });

    // Get booking data from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.bookingData = navigation.extras.state['bookingData'];
      console.log('Payment Component - Booking session data:', this.bookingData);
    }

    // If no booking data in navigation state, try to get from query params
    if (!this.bookingData) {
      this.route.queryParams.subscribe(params => {
        if (params['bookingData']) {
          try {
            this.bookingData = JSON.parse(decodeURIComponent(params['bookingData']));
            console.log('Payment Component - Booking session data from query params:', this.bookingData);
          } catch (e) {
            console.error('Failed to parse booking data from query params:', e);
          }
        }
      });
    }
  }

  goBack() {
    if (this.menteeId) {
      this.router.navigate(['/mentee', this.menteeId, 'search-mentors']);
    } else {
      this.router.navigate(['/mentee/search-mentors']);
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }

  formatTimeSlot(timeSlot: string): string {
    if (!timeSlot) return '';
    try {
      // timeSlot format: "9:00-10:00"
      const [startTime] = timeSlot.split('-');
      const [hour, minute] = startTime.split(':');
      const date = new Date();
      date.setHours(parseInt(hour, 10), parseInt(minute, 10));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return timeSlot;
    }
  }

  getSessionTypeDisplay(): string {
    if (!this.bookingData?.sessionType) return 'Session';
    return this.bookingData.sessionType === 'interview' ? 'Mock Interview' : 'Mentorship';
  }
}
