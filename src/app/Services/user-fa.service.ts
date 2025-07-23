
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.development';
import { PagedResult } from '../Models/FQA/FaqDto';
import { UserFADto } from '../Models/articles/UserFADto';

@Injectable({
  providedIn: 'root',
})
export class UserFAService {
  private apiUrl = `${environment.apiUrl}/UsersFA`;

  constructor(private http: HttpClient) {}

  getAllUsersForAdmin(
    pageNumber: number = 1,
    pageSize: number = 100
  ): Observable<PagedResult<UserFADto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PagedResult<UserFADto>>(`${this.apiUrl}/admin`, {
      params,
    });
  }
}
