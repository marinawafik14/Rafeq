import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Users } from '../Models/Users';
import { SemanticMentorResult } from '../Models/SemanticMentorResult';

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

  constructor(private http: HttpClient) {}

  /**
   * Get a mentor by their user ID
   */
  getMentorById(mentorId: number): Observable<Users> {
    return this.http.get<Users>(`${environment.apiUrl}/users/${mentorId}`);
  }

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

  semanticMentorSearch(
    query: string,
    minRating?: number,
    maxHourlyRate?: number,
    skills?: string[],
    maxResults?: number
  ) {
    const body: any = { query };
    if (minRating) body.minRating = minRating;
    if (maxHourlyRate) body.maxHourlyRate = maxHourlyRate;
    if (skills && skills.length > 0) body.skills = skills;
    if (maxResults) body.maxResults = maxResults;
    return this.http.post<{ success: boolean, mentors: SemanticMentorResult[], totalResults: number, searchTime: number }>(
      `${environment.apiUrl}/Embedding/mentors/semantic-search`,
      body,
      { headers: { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` } }
    );
  }
}
