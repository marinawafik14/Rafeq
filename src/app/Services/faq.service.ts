import { Injectable } from '@angular/core';
import { environment } from '../environments/environment.development';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { FaqDto, PagedResult } from '../Models/FQA/FaqDto';
import { FaqCategoryDto } from '../Models/FQA/FaqCategoryDto';

@Injectable({
  providedIn: 'root'
})
export class FaqService {
    private apiUrl = `${environment.apiUrl}/FAQ`;

  constructor(private http: HttpClient) { }

getFaq(
    category?: string,
    searchQuery?: string,
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<PagedResult<FaqDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (category) {
      params = params.set('category', category);
    }
    if (searchQuery) {
      params = params.set('searchQuery', searchQuery);
    }

    return this.http.get<PagedResult<FaqDto>>(this.apiUrl, { params: params }).pipe(
      catchError(this.handleError)
    );
  }

  getFaqCategories(): Observable<FaqCategoryDto[]> {
    return this.http.get<FaqCategoryDto[]>(`${this.apiUrl}/categories`).pipe(
      catchError(this.handleError)
    );
  }


    incrementFaqViewCount(faqId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${faqId}/view`, {}).pipe(
      catchError(this.handleError)
    );
  }


    incrementFaqHelpfulCount(faqId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${faqId}/helpful`, {}).pipe(
      catchError(this.handleError)
    );
  }


    incrementFaqNotHelpfulCount(faqId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${faqId}/nothelpful`, {}).pipe(
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
