import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reviews } from '../Models/Reviews';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class WriteByReviewsService {
  private writeByReviewsUrl = `${environment.apiUrl}/Reviews/written-by`;

  constructor(private http : HttpClient) { }

  getReviewsByUserId(userId: number): Observable<Reviews[]> {
    return this.http.get<Reviews[]>(`${this.writeByReviewsUrl}/${userId}`);
  }
}
