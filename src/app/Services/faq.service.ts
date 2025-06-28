import { Injectable } from '@angular/core';
import { environment } from '../environments/environment.development';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { FaqDto } from '../Models/FQA/FaqDto';
import { FaqCategoryDto } from '../Models/FQA/FaqCategoryDto';

@Injectable({
  providedIn: 'root'
})
export class FaqService {
    private apiUrl = `${environment.apiUrl}/FAQ`;

  constructor(private http: HttpClient) { }

  getFaq(category?: string): Observable<FaqDto[]> {
    let params = new HttpParams(); // Use HttpParams for query parameters
    if (category) {
      params = params.set('category', category);
    }
    // No Authorization header needed as these endpoints are [AllowAnonymous]
    return this.http.get<FaqDto[]>(this.apiUrl, { params: params }).pipe(
      catchError(this.handleError)
    );
  }

  getFaqCategories(): Observable<FaqCategoryDto[]> {
    // No Authorization header needed as this endpoint is [AllowAnonymous]
    return this.http.get<FaqCategoryDto[]>(`${this.apiUrl}/categories`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else if (typeof error.error === 'string') {
      errorMessage = error.error;
    } else if (error.error && (error.error as any).message) {
      errorMessage = (error.error as any).message;
    } else {
      errorMessage = `Server Error (${error.status}): ${JSON.stringify(error.error || error.statusText)}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
