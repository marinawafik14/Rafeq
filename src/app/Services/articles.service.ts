import { Injectable } from '@angular/core';
import { environment } from '../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ArticleDto, ArticleListDto, PagedResult } from '../Models/articles/ArticleDto';



@Injectable({
  providedIn: 'root'
})
export class ArticlesService {
    private apiUrl = `${environment.apiUrl}/Articles`;

  constructor(private http: HttpClient) { }

   getArticles(
    category?: string,
    pageNumber: number = 1,
    pageSize: number = 6,
    searchQuery?: string
  ): Observable<PagedResult<ArticleListDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (category) {
      params = params.set('category', category);
    }
    if (searchQuery) {
      params = params.set('searchQuery', searchQuery);
    }

    return this.http.get<PagedResult<ArticleListDto>>(this.apiUrl, { params });
  }

  getArticleById(id: number): Observable<ArticleDto> {
    return this.http.get<ArticleDto>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

    incrementViewCount(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/view`, {});
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Server Error (${error.status}): ${error.error?.message || error.statusText || JSON.stringify(error.error)}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
