import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Payments } from '../Models/Payments';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
paymentsUrl = 'https://localhost:7001/api/admin/payments'
totalRevenueUrl = 'https://localhost:7001/api/admin/revenues/total';
  constructor(private http : HttpClient) { }
  getPayments ():Observable<Payments[]> {
    return this.http.get<Payments[]>(this.paymentsUrl);
  }
}
