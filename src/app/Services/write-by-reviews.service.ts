import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reviews } from '../Models/Reviews';

@Injectable({
  providedIn: 'root'
})
export class WriteByReviewsService {
  private writeByReviewsUrl = 'https://localhost:7001/api/Reviews/written-by';

  constructor(private http : HttpClient) { }

  getReviewsByUserId(userId: number): Observable<Reviews[]> {
    return this.http.get<Reviews[]>(`${this.writeByReviewsUrl}/${userId}`);
  }
}
