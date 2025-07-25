import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import {
  ArticleDto,
  ArticleListDto,
  PagedResult,
} from '../Models/articles/ArticleDto';
import { environment } from '../environments/environment.development';
import { ArticleCreateUpdateDto } from '../Models/articles/ArticleCreateUpdateDto';

@Injectable({
  providedIn: 'root',
})
export class ArticlesService {
  private apiUrl = `${environment.apiUrl}/Articles`;

  constructor(private http: HttpClient) {}

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

    return this.http
      .get<PagedResult<ArticleListDto>>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  getArticleById(id: number): Observable<ArticleDto> {
    return this.http
      .get<ArticleDto>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  incrementViewCount(id: number): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/${id}/view`, {})
      .pipe(catchError(this.handleError));
  }

  getArticleCategories(): Observable<string[]> {
    return this.http
      .get<string[]>(`${this.apiUrl}/categories`)
      .pipe(catchError(this.handleError));
  }



  getAllArticlesForAdmin(
    pageNumber: number = 1,
    pageSize: number = 10,
    category?: string,
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

    return this.http
      .get<PagedResult<ArticleListDto>>(`${this.apiUrl}/admin`, { params })
      .pipe(catchError(this.handleError));
  }

  getArticleByIdForAdmin(id: number): Observable<ArticleDto> {
    return this.http
      .get<ArticleDto>(`${this.apiUrl}/admin/${id}`)
      .pipe(catchError(this.handleError));
  }

  createArticle(article: ArticleCreateUpdateDto): Observable<ArticleDto> {
    return this.http
      .post<ArticleDto>(this.apiUrl, article)
      .pipe(catchError(this.handleError));
  }

  updateArticle(
    id: number,
    article: ArticleCreateUpdateDto
  ): Observable<ArticleDto> {
    return this.http
      .put<ArticleDto>(`${this.apiUrl}/${id}`, article)
      .pipe(catchError(this.handleError));
  }

  deleteArticle(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Server Error (${error.status}): ${
        error.error?.message || error.statusText || JSON.stringify(error.error)
      }`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
