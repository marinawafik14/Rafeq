import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Users } from '../Models/Users';
import { MentorProfile } from '../Models/mentor-profile';
import { environment } from '../environments/environment';

export interface MentorSearchFilters {
  skills?: number[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface MentorSearchResult {
  mentors: Users[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class MentorSearchService {
  private apiUrl = `${environment.apiUrl}/users/mentors`;
  private mentorApiUrl = `${environment.apiUrl}/mentors`;

  constructor(private http: HttpClient) {}

  searchMentors(filters: MentorSearchFilters): Observable<MentorSearchResult> {
    let params = new HttpParams();
    if (filters.skills) params = params.set('skills', filters.skills.join(','));
    if (filters.minPrice !== undefined) params = params.set('minPrice', filters.minPrice);
    if (filters.maxPrice !== undefined) params = params.set('maxPrice', filters.maxPrice);
    if (filters.minRating !== undefined) params = params.set('minRating', filters.minRating);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    if (filters.page !== undefined) params = params.set('page', filters.page);
    if (filters.pageSize !== undefined) params = params.set('pageSize', filters.pageSize);
    return this.http.get<MentorSearchResult>(this.apiUrl, { params });
  }

  getMentorById(id: number): Observable<MentorProfile> {
    return this.http.get<MentorProfile>(`${this.mentorApiUrl}/${id}`);
  }
}
