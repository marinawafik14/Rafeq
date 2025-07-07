import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'; // Add this import
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


export class PaymentComponent implements AfterViewInit, OnDestroy, OnInit {
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
    private http: HttpClient, // Add this injection
    private paymentService: PaymentService,
    private authService: AuthService
  ) {}

ngOnInit(): void {
  const state = history.state;
  const queryBookingId = this.route.snapshot.queryParamMap.get('bookingId');
  const queryAmount = this.route.snapshot.queryParamMap.get('amount');

  if (state && state.bookingId) {
    this.bookingId = state.bookingId;
  } else if (queryBookingId) {
    this.bookingId = +queryBookingId;
  } else {
    this.errorMessage = 'Missing booking ID. Please try booking again.';
    this.errorVisible = true;
    this.loadingVisible = false;
    return;
  }

  // Get the amount from navigation state or query params
  const amount = state?.amount || queryAmount || 60;

  // Load actual booking details to get session info
  this.loadBookingDetails();
}

// Add this new method to load booking details
private loadBookingDetails(): void {
  // First try to load from booking service to get session date/time
  this.http.get<any>(`https://localhost:7001/api/MenteeBookings/${this.bookingId}`).subscribe({
    next: (booking) => {
      this.paymentDetails = {
        paymentId: 0,
        bookingId: this.bookingId,
        amountPaid: booking.totalAmount || 60,
        paymentMethod: 'card',
        transactionId: '',
        paymentDate: new Date().toISOString(),
        mentorName: booking.mentorName || 'Mentor',
        menteeName: 'You',
        sessionType: booking.sessionType || 'Mentorship',
        sessionDateTime: booking.startDateTime, // Use session date, not payment date
        commission: Math.round((booking.totalAmount || 60) * 0.2 * 100) / 100,
        mentorAmount: Math.round((booking.totalAmount || 60) * 0.8 * 100) / 100
      };
      this.loadingVisible = false;
    },
    error: (err) => {
      console.error('Error loading booking details:', err);
      // Fallback to query params
      const amount = +this.route.snapshot.queryParamMap.get('amount')! || 60;
      this.paymentDetails = {
        paymentId: 0,
        bookingId: this.bookingId,
        amountPaid: amount,
        paymentMethod: 'card',
        transactionId: '',
        paymentDate: new Date().toISOString(),
        mentorName: 'Mentor',
        menteeName: 'You',
        sessionType: amount >= 100 ? 'Interview' : 'Mentorship',
        sessionDateTime: new Date().toISOString(),
        commission: Math.round(amount * 0.2 * 100) / 100,
        mentorAmount: Math.round(amount * 0.8 * 100) / 100
      };
      this.loadingVisible = false;
    }
  });
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
    console.log('Creating payment intent for booking:', this.bookingId);
    const intentResponse = await this.paymentService.createPaymentIntent(this.bookingId).toPromise();
    
    console.log('Payment intent response:', intentResponse); // ✅ Add this debug log
    
    if (!intentResponse?.success || !intentResponse?.data?.clientSecret) {
      console.error('Invalid payment intent response:', intentResponse); // ✅ Add this debug log
      throw new Error(intentResponse?.message || 'Could not create payment intent.');
    }

    const clientSecret = intentResponse.data.clientSecret;

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
      
      // Clear the pending booking from session storage since payment was successful
      sessionStorage.removeItem('pendingBooking');
      sessionStorage.removeItem(`booking_${this.bookingId}_amount`);
      
      setTimeout(() => {
        // ✅ Fix: Use the correct route path from your routes
        this.router.navigate(['/mentee/payment-complete'], {
          state: { 
            paymentId: confirmResult.data.paymentId,
            bookingDetails: confirmResult.data  // ✅ Pass the full booking details
          }
        });
      }, 1500);
    }
    
  } catch (err: any) {
    console.error('Payment error details:', err); // ✅ Better error logging
    
    // ✅ Extract the actual backend error message
    let errorMessage = 'An unexpected error occurred.';
    
    if (err?.error?.message) {
      errorMessage = err.error.message; // Backend API error message
    } else if (err?.message) {
      errorMessage = err.message; // JavaScript error message
    }
    
    console.log('Final error message:', errorMessage); // ✅ Debug the error message
    this.errorMessage = errorMessage;
    this.errorVisible = true;
  }
}
}