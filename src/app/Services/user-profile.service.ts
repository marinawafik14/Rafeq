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

  /**
   * Fetches the authenticated user's profile.
   */
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Updates the authenticated mentee's profile.
   * @param profileData Data for mentee profile update.
   */
  updateMenteeProfile(profileData: UpdateMenteeProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/mentee`, profileData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Updates the authenticated mentor's profile.
   * @param profileData Data for mentor profile update.
   */
  updateMentorProfile(profileData: UpdateMentorProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/mentor`, profileData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Updates the authenticated user's profile picture using a provided URL (if backend supports).
   * Note: Your backend also has a file upload method, prefer that for new uploads.
   * @param profilePictureUrl The URL of the new profile picture.
   */
  updateProfilePictureByUrl(profilePictureUrl: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/update-photo-by-url`, JSON.stringify(profilePictureUrl), {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'text' // Backend might return a plain string URL
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Uploads a profile picture file directly to the server.
   * @param file The image file to upload.
   * @returns The URL of the uploaded file.
   */
  uploadProfilePictureFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/upload-photo`, formData, {
      responseType: 'text' 
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Changes the authenticated user's password.
   * @param passwordData Contains current, new, and confirmed new passwords.
   */
  changePassword(passwordData: ChangePassword): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-password`, passwordData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Toggles the mentor's interviewer status.
   * @param isInterviewer New interviewer status.
   */
  toggleMentorInterviewerStatus(isInterviewer: boolean): Observable<any> {
    let params = new HttpParams().set('isInterviewer', isInterviewer.toString());
    return this.http.put(`${this.apiUrl}/toggle-mentor-interviewer-status`, null, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Updates the mentor's hourly rate.
   * @param hourlyRate New hourly rate.
   */
  updateMentorHourlyRate(hourlyRate: number): Observable<any> {
    let params = new HttpParams().set('hourlyRate', hourlyRate.toString());
    return this.http.put(`${this.apiUrl}/hourly-rate`, null, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Gets a public profile of a specific mentor.
   * @param mentorId The ID of the mentor.
   */
  getMentorPublicProfile(mentorId: number): Observable<Mentor> {
    return this.http.get<Mentor>(`${this.apiUrl}/mentors/${mentorId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Gets a list of all mentors with optional filters.
   * @param skill Optional skill to filter by.
   * @param minRate Optional minimum hourly rate.
   * @param maxRate Optional maximum hourly rate.
   * @param rating Optional minimum rating.
   */
  getAllMentors(
    skill?: string,
    minRate?: number,
    maxRate?: number,
    rating?: number
  ): Observable<Mentor[]> {
    let params = new HttpParams();
    if (skill) {
      params = params.set('skill', skill);
    }
    if (minRate) {
      params = params.set('minRate', minRate.toString());
    }
    if (maxRate) {
      params = params.set('maxRate', maxRate.toString());
    }
    if (rating) {
      params = params.set('rating', rating.toString());
    }
    return this.http.get<Mentor[]>(`${this.apiUrl}/mentors`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Fetches all available skills from the backend.
   */
  getSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${environment.apiUrl}/Skills`).pipe(
      catchError(this.handleError)
    );
  }
}
