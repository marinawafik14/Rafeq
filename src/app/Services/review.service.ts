import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reviews } from '../Models/Reviews';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
reviewUrl ='https://localhost:7001/api/admin/reviews';
  constructor(private http : HttpClient) { }

getReviews() : Observable<Reviews[]>{
 return  this.http.get<Reviews[]>(this.reviewUrl)
}
// delete review
deleteReview (id : number):Observable<void>{
 return  this.http.delete<void>(`${this.reviewUrl}/${id}`)
}

}
