import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentService } from '../Services/payment.service';
import { PaymentDetailsDto } from '../Models/Payments/payment-details.model';
import { CommonModule } from '@angular/common';
import { AuthService } from '../Services/auth.service';


@Component({
   selector: 'app-payment',
  imports: [CommonModule],

  templateUrl: './payment.component.html'
})


export class PaymentComponent implements AfterViewInit, OnDestroy,OnInit {
  @ViewChild('cardInfo') cardInfo!: ElementRef;

  stripe: any;
  card: any;

  paymentDetails: PaymentDetailsDto['data'] | null = null;
  paymentId!: number;
  bookingId!: number;

  loadingVisible: boolean = true;
  errorVisible: boolean = false;
  successVisible: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private authService: AuthService
  ) {}

ngOnInit(): void {
  const state = history.state;
  const queryBookingId = this.route.snapshot.queryParamMap.get('bookingId');

  if (state.bookingId) {
    this.bookingId = state.bookingId;
  } else if (queryBookingId) {
    this.bookingId = +queryBookingId;
  } else {
    this.errorMessage = 'Missing booking ID.';
    this.errorVisible = true;
    return;
  }

  console.log('Loaded bookingId:', this.bookingId); // Debugging
}



  async ngAfterViewInit(): Promise<void> {
    this.stripe = await loadStripe('pk_test_51RY3tP4Ku1yMQ0pw1dN91yYC5hXgeCpQy8n5VUhIdg9tPXjK0TXxKYWqFcF64dskcOAtihPRk1EZtq2K8gjettjQ00NDh0wgsp');

    const elements = this.stripe.elements();
    this.card = elements.create('card', {
      hidePostalCode: true,
      style: {
        base: {
          color: '#0a2e65',
          fontSize: '16px'
        }
      }
    });

    this.card.mount(this.cardInfo.nativeElement);

    this.card.on('change', (event: any) => {
      console.log('Card change:', event);
    });
  }

  ngOnDestroy(): void {
    if (this.card) {
      this.card.unmount();
    }
  }

  async onSubmit(event: Event): Promise<void> {
  event.preventDefault();




  if (!this.authService.isLoggedIn()) {
    this.errorMessage = 'Session expired. Please log in again.';
  this.errorVisible = true;
  return;
  }
  
  const userId = this.authService.getCurrentUserId();
  if (!userId) {
    console.log('User not logged in');
    this.errorMessage = 'User not authenticated.';
    this.errorVisible = true;
    return;
  }

  try {
    // Step 1: Create PaymentIntent using BookingId + UserId
    const intentResponse = await this.paymentService.createPaymentIntent(this.bookingId).toPromise();
    
    if (!intentResponse?.clientSecret) {
      throw new Error('Could not create payment intent.');
    }

    const clientSecret = intentResponse.clientSecret;

    // Step 2: Confirm Card Payment via Stripe
    const result = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: this.card
      }
    });

    if (result.error) {
      this.errorMessage = result.error.message ?? 'Payment failed.';
      this.errorVisible = true;
      return;
    }

    // Step 3: Confirm with backend
    const confirmResult = await this.paymentService.confirmPayment({
      paymentIntentId: result.paymentIntent.id,
      bookingId: this.bookingId
    }).toPromise();

   if (confirmResult?.success) {
  this.successVisible = true;
  setTimeout(() => {
    this.router.navigate(['/booking/confirmation'], {
      state: { paymentId: confirmResult.data.paymentId }
    });
  }, 1500);
}


  
  } catch (err: any) {
    console.error('Payment error:', err);
    this.errorMessage = err?.error?.message || 'An unexpected error occurred.';
    this.errorVisible = true;
  }

}
}