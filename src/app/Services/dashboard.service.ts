import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DashboardStatus } from '../Models/dashboard-status';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http : HttpClient) { }
  DashboardUrl = `${environment.apiUrl}/admin/dashboard`;



  getDashboardStatus() : Observable<DashboardStatus[]> {
    return this.http.get<DashboardStatus[]>(this.DashboardUrl);
  }
}
