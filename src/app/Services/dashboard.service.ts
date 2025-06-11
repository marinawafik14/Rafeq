import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DashboardStatus } from '../Models/dashboard-status';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http : HttpClient) { }
  DashboardUrl = "https://localhost:7001/api/admin/dashboard";



  getDashboardStatus() : Observable<DashboardStatus[]> {
    return this.http.get<DashboardStatus[]>(this.DashboardUrl);
  }
}
