import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule],
  selector: 'app-payment-confirmation',
  templateUrl: './payment-confirmation.component.html'
})
export class PaymentConfirmationComponent implements OnInit {
  bookingDetails: any;
  meetLink = 'https://meet.google.com/abc-defg-hij ';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    // Fetch booking details from service or store
    this.bookingDetails = {
      mentorName: 'Ahmed Mohamed',
      amountPaid: 150,
      sessionDateTime: new Date(),
      meetLink: this.meetLink
    };
  }
}