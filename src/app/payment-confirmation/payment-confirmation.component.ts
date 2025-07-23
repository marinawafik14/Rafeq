import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule],
  selector: 'app-payment-confirmation',
  templateUrl: './payment-confirmation.component.html'
  , styleUrls: ['./payment-confirmation.component.css'],
})
export class PaymentConfirmationComponent implements OnInit {
  bookingDetails: any;
  meetLink = 'https://meet.google.com/abc-defg-hij ';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    sessionStorage.removeItem('pendingBooking');
    
    const state = history.state;
    
    if (state && state.bookingDetails) {
      this.bookingDetails = {
        mentorName: state.bookingDetails.mentorName || 'Your Mentor',
        amountPaid: state.bookingDetails.amountPaid || 0,
        sessionDateTime: state.bookingDetails.sessionDateTime ? new Date(state.bookingDetails.sessionDateTime) : new Date(),
        meetLink: this.meetLink,
        sessionType: state.bookingDetails.sessionType || 'Mentorship Session'
      };
    } else {
      const id = +this.route.snapshot.paramMap.get('id')!;
      const queryParams = this.route.snapshot.queryParams;
      const bookingId = queryParams['bookingId'] || id;
      
      let amount = 60; 
      if (bookingId) {
        const storedAmount = sessionStorage.getItem(`booking_${bookingId}_amount`);
        if (storedAmount) {
          amount = parseFloat(storedAmount);
        
          sessionStorage.removeItem(`booking_${bookingId}_amount`);
        }
      }
      
      this.bookingDetails = {
        mentorName: 'Your Mentor',
        amountPaid: amount,
        sessionDateTime: new Date(),
        meetLink: this.meetLink,
        sessionType: amount >= 100 ? 'Interview Session' : 'Mentorship Session'
      };
    }
  }

  copyMeetLink(): void {
    navigator.clipboard.writeText(this.meetLink).then(() => {
    
      console.log('Meet link copied to clipboard');
    });
  }

  addToGoogleCalendar(): void {
    const startDate = new Date(this.bookingDetails.sessionDateTime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); 
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(this.bookingDetails.sessionType + ' with ' + this.bookingDetails.mentorName)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent('Google Meet Link: ' + this.meetLink)}&location=${encodeURIComponent(this.meetLink)}`;
    
    window.open(calendarUrl, '_blank');
  }

  addToOutlook(): void {
    const startDate = new Date(this.bookingDetails.sessionDateTime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); 
    
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(this.bookingDetails.sessionType + ' with ' + this.bookingDetails.mentorName)}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${encodeURIComponent('Google Meet Link: ' + this.meetLink)}&location=${encodeURIComponent(this.meetLink)}`;
    
    window.open(outlookUrl, '_blank');
  }

  goHome(): void {
    this.router.navigate(['/mentee/dashboard']);
  }
}