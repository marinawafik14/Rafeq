import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reviews } from '../Models/Reviews';
import { environment } from '../environments/environment.development';
import { MentorReview } from '../Models/Review/mentor-review.interface';

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


  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.reviewUrl}/${id}`);
  }


  getMentorReviews(mentorId: number): Observable<MentorReview[]> {
    return this.http.get<MentorReview[]>(`${this.apiUrl}/reviews/mentor/${mentorId}`);
  }


  getMenteeReviews(menteeId: number): Observable<MentorReview[]> {
    return this.http.get<MentorReview[]>(`${this.apiUrl}/reviews/mentee/${menteeId}`);
  }


  getMyMentorReviews(): Observable<MentorReview[]> {
    return this.http.get<MentorReview[]>(`${this.apiUrl}/reviews/mentor/me`);
  }
}
