import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStatus } from '../Models/dashboard-status';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private apiUrl = 'https://localhost:7001/api/admin/dashboard';

  constructor(private http: HttpClient) {}

  getDashboardStatus(): Observable<DashboardStatus> {
    return this.http.get<DashboardStatus>(this.apiUrl);
  }
}