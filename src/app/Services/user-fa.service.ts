// src/app/services/user-fa.service.ts (formerly user.service.ts)
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.development';
import { PagedResult } from '../Models/FQA/FaqDto';
import { UserDto } from '../Models/articles/UserDto';


@Injectable({
  providedIn: 'root'
})
export class UserFAService { // Renamed class
  private apiUrl = `${environment.apiUrl}/Users`; // Adjust this if your User API path is different

  constructor(private http: HttpClient) { }

  getAllUsersForAdmin(pageNumber: number = 1, pageSize: number = 100): Observable<PagedResult<UserDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PagedResult<UserDto>>(`${this.apiUrl}/admin`, { params });
  }
}
