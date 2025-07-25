import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators'; 
import { Payments } from '../Models/Payments/Payments';
import { PaymentDetailsDto } from '../Models/Payments/payment-details.model';
import { CreatePaymentIntentDto } from '../Models/Payments/CreatePaymentIntentDto';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
paymentsUrl = `${environment.apiUrl}/admin/payments`
totalRevenueUrl = `${environment.apiUrl}/admin/revenues/total`;
apiUrl = `${environment.apiUrl}/payments`;
  constructor(private http : HttpClient) { }

  getPaymentById(paymentId: number): Observable<PaymentDetailsDto> {
    return this.http.get<PaymentDetailsDto>(`${this.apiUrl}/${paymentId}`);
  }


getPaymentDetailsByBookingId(bookingId: number): Observable<PaymentDetailsDto> {
  return this.http.get<PaymentDetailsDto>(`${this.apiUrl}/by-booking/${bookingId}`);
}
createPaymentIntent(bookingId: number): Observable<any> {
  const requestBody = { bookingId: bookingId };
  
  console.log('=== PAYMENT INTENT REQUEST ===');
  console.log('URL:', `${this.apiUrl}/create-intent`);
  console.log('Request body:', requestBody);
  console.log('BookingId being sent:', bookingId);
  console.log('==============================');
  
  return this.http.post<any>(`${this.apiUrl}/create-intent`, requestBody).pipe(
    tap(response => {
      console.log('=== PAYMENT INTENT RESPONSE ===');
      console.log('Response:', response);
      console.log('===============================');
    }),
    catchError(error => {
      console.error('=== PAYMENT INTENT ERROR ===');
      console.error('Error status:', error.status);
      console.error('Error body:', error.error);
      console.error('============================');
      throw error; 
    })
  );
}



  confirmPayment(dto: PaymentConfirmationDto): Observable<{ success: boolean; message: string; data: { paymentId: number } }> {
  return this.http.post<{ success: boolean; message: string; data: { paymentId: number } }>(
    `${this.apiUrl}/confirm`,
    dto
  );
}



  getPayments ():Observable<Payments[]> {
    return this.http.get<Payments[]>(this.paymentsUrl);
  }
}

export interface PaymentConfirmationDto {
  paymentIntentId: string;
  bookingId: number;
}
