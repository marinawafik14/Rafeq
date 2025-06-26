import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment.development';
import { catchError, Observable, throwError } from 'rxjs';
import { UserProfile } from '../Models/User/user-profile';
import { UpdateMenteeProfile } from '../Models/UserProfile/UpdateMenteeProfileDto';
import { UpdateMentorProfile } from '../Models/UserProfile/UpdateMentorProfileDto';
import { ChangePassword } from '../Models/UserProfile/ChangePassword';
import { Mentor } from '../Models/UserProfile/Mentor';
import { Skill } from '../Models/Skills/skill';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
 private apiUrl = `${environment.apiUrl}/UserProfile`;
  constructor(private http: HttpClient) { }


   private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else if (error.error && typeof error.error === 'string') {
      errorMessage = `Server Error: ${error.error}`;
    } else if (error.error && typeof error.error === 'object' && (error.error as any).message) {
      errorMessage = `Server Error: ${(error.error as any).message}`;
    } else if (error.error && (error.error as any).errors) {
      const errors = (error.error as any).errors;
      errorMessage = Object.values(errors).flat().join('\n');
    } else {
      errorMessage = `Server returned code ${error.status}: ${error.message}`;
    }
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`).pipe(
      catchError(this.handleError)
    );
  }


  updateMenteeProfile(profileData: UpdateMenteeProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/mentee`, profileData).pipe(
      catchError(this.handleError)
    );
  }


  updateMentorProfile(profileData: UpdateMentorProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/mentor`, profileData).pipe(
      catchError(this.handleError)
    );
  }


  updateProfilePictureByUrl(profilePictureUrl: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/update-photo-by-url`, JSON.stringify(profilePictureUrl), {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'text'
    }).pipe(
      catchError(this.handleError)
    );
  }

  uploadProfilePictureFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/upload-photo`, formData, {
      responseType: 'text'
    }).pipe(
      catchError(this.handleError)
    );
  }

  changePassword(passwordData: ChangePassword): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password`, passwordData).pipe(
      catchError(this.handleError)
    );
  }

  toggleMentorInterviewerStatus(isInterviewer: boolean): Observable<any> {
    let params = new HttpParams().set('isInterviewer', isInterviewer.toString());
    return this.http.put(`${this.apiUrl}/toggle-mentor-interviewer-status`, null, { params }).pipe(
      catchError(this.handleError)
    );
  }

  updateMentorHourlyRate(hourlyRate: number): Observable<any> {
    let params = new HttpParams().set('hourlyRate', hourlyRate.toString());
    return this.http.put(`${this.apiUrl}/hourly-rate`, null, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getMentorPublicProfile(mentorId: number): Observable<Mentor> {
    return this.http.get<Mentor>(`${this.apiUrl}/mentors/${mentorId}`).pipe(
      catchError(this.handleError)
    );
  }


  // getAllMentors(
  //   skill?: string,
  //   minRate?: number,
  //   maxRate?: number,
  //   rating?: number
  // ): Observable<Mentor[]> {
  //   let params = new HttpParams();
  //   if (skill) {
  //     params = params.set('skill', skill);
  //   }
  //   if (minRate) {
  //     params = params.set('minRate', minRate.toString());
  //   }
  //   if (maxRate) {
  //     params = params.set('maxRate', maxRate.toString());
  //   }
  //   if (rating) {
  //     params = params.set('rating', rating.toString());
  //   }
  //   return this.http.get<Mentor[]>(`${this.apiUrl}/mentors`, { params }).pipe(
  //     catchError(this.handleError)
  //   );
  // }

  getSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${environment.apiUrl}/Skills`).pipe(
      catchError(this.handleError)
    );
  }
}
