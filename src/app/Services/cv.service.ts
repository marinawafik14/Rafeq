import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CvService {
  private baseUrl = 'https://localhost:7001/api/MenteeCVs';

  constructor(private http: HttpClient) {}

  getMenteeCVs(menteeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/mentee/${menteeId}`);
  }
}
