import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Payments } from '../Models/Payments/Payments';
import { PaymentDetailsDto } from '../Models/Payments/payment-details.model';
import { CreatePaymentIntentDto } from '../Models/Payments/CreatePaymentIntentDto';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
paymentsUrl = 'https://localhost:7001/api/admin/payments'
totalRevenueUrl = 'https://localhost:7001/api/admin/revenues/total';
apiUrl = 'https://localhost:7001/api/payments';
  constructor(private http : HttpClient) { }
  // Load payment details by ID
  getPaymentById(paymentId: number): Observable<PaymentDetailsDto> {
    return this.http.get<PaymentDetailsDto>(`${this.apiUrl}/${paymentId}`);
  }

// payment.service.ts

createPaymentIntent(bookingId: number, userId: number): Observable<CreatePaymentIntentDto> {
  const body = { bookingId, userId };
  return this.http.post<CreatePaymentIntentDto>(
    `${this.apiUrl}/create-intent`,
    body
  );
}

  // Confirm PaymentIntent after Stripe success
   confirmPayment(dto: PaymentConfirmationDto): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/confirm`,
      dto
    );
  }


  getPayments ():Observable<Payments[]> {
    return this.http.get<Payments[]>(this.paymentsUrl);
  }
}
  // DTOs used in calls
export interface PaymentConfirmationDto {
  paymentIntentId: string;
  paymentId: number;
  bookingId: number;
}

