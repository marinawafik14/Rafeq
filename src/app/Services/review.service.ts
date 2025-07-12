import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reviews } from '../Models/Reviews';
import { environment } from '../environments/environment.development';

export interface MentorReview {
  id: number;
  rating: number;
  comment: string;
  reviewDate: string;
  menteeId: number;
  menteeName?: string;
  mentorId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private reviewUrl = `${environment.apiUrl}/admin/reviews`;
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getReviews(): Observable<Reviews[]> {
    return this.http.get<Reviews[]>(this.reviewUrl);
  }

  // delete review
  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.reviewUrl}/${id}`);
  }

  // Get reviews for a specific mentor
  getMentorReviews(mentorId: number): Observable<MentorReview[]> {
    return this.http.get<MentorReview[]>(`${this.apiUrl}/reviews/mentor/${mentorId}`);
  }

  // Get reviews by a specific mentee
  getMenteeReviews(menteeId: number): Observable<MentorReview[]> {
    return this.http.get<MentorReview[]>(`${this.apiUrl}/reviews/mentee/${menteeId}`);
  }
}
