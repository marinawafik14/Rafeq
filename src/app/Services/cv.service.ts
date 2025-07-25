import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class CvService {
  private baseUrl = `${environment.apiUrl}/MenteeCVs`;

  constructor(private http: HttpClient) {}

 
  getCurrentUserCVs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}`);
  }
}
