import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment.development';
import { CVDetails } from '../Models/CV/cv-details';
import { CVComment } from '../Models/CV/cv-comment';
import { AddCVCommentRequest } from '../Models/CV/add-cv-comment-request';

@Injectable({
  providedIn: 'root'
})
export class CVReviewService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  
  getMenteeCVs(): Observable<CVDetails[]> {
    return this.http.get<CVDetails[]>(`${this.apiUrl}/CVs/for-review`);
  }


  getCVComments(cvId: number): Observable<CVComment[]> {
    return this.http.get<CVComment[]>(`${this.apiUrl}/MenteeCVs/comments/${cvId}`);
  }

 
  addComment(request: AddCVCommentRequest): Observable<CVComment> {
    return this.http.post<{success: boolean, message: string, data: CVComment}>(`${this.apiUrl}/CVs/comments`, request)
      .pipe(
        map(response => response.data)
      );
  }


  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<{success: boolean, message: string}>(`${this.apiUrl}/CVs/comments/${commentId}`)
      .pipe(
        map(() => void 0)
      );
  }


  getCVFile(fileName: string): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/CVs/download/${fileName}`, { 
      responseType: 'blob',
      headers: headers
    });
  }


  getCVFileUrl(downloadUrl: string): string {
    const fileName = downloadUrl.split('/').pop();
    const token = localStorage.getItem('token');
    return `${this.apiUrl}/CVs/download/${fileName}?token=${token}`;
  }

 
  getFileNameFromUrl(downloadUrl: string): string {
    return downloadUrl.split('/').pop() || '';
  }
}