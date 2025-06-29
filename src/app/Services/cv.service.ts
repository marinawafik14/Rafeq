import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CvService {
  private baseUrl = '/api/MenteeCVs';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Get CVs for the current user
  getCurrentUserCVs(): Observable<any[]> {
    console.log('CV Service: Getting CVs for current user from /api/MenteeCVs/users/cv');

    return this.http.get<any>(`${this.baseUrl}`, {
      headers: this.getAuthHeaders(),
      responseType: 'json'
    }).pipe(
      tap(response => {
        console.log('CV Service: Raw response:', response);
        console.log('CV Service: Response type:', typeof response);
        console.log('CV Service: Is array:', Array.isArray(response));
      }),
      map(response => {
        // Handle single CV object or array
        if (Array.isArray(response)) {
          return response;
        } else if (response && typeof response === 'object') {
          // Single CV object - wrap in array
          return [response];
        } else {
          // Empty or invalid response
          return [];
        }
      }),
      catchError(error => {
        console.error('CV Service: Error getting CVs:', error);
        console.error('CV Service: Error status:', error.status);
        console.error('CV Service: Error body:', error.error);
        
        // If it's a 200 but treated as error, it might be a proxy issue
        if (error.status === 200) {
          console.log('CV Service: Status 200 but treated as error - proxy might be returning HTML instead of JSON');
          console.log('CV Service: This usually means the proxy is not forwarding to the backend correctly');
          
          // Try direct backend call as fallback
          console.log('CV Service: Trying direct backend call...');
          return this.http.get<any>('https://localhost:7001/api/MenteeCVs/users/cv', {
            headers: this.getAuthHeaders()
          }).pipe(
            map(directResponse => {
              console.log('CV Service: Direct backend response:', directResponse);
              if (Array.isArray(directResponse)) {
                return directResponse;
              } else if (directResponse && typeof directResponse === 'object') {
                return [directResponse];
              } else {
                return [];
              }
            }),
            catchError(directError => {
              console.error('CV Service: Direct backend call also failed:', directError);
              return of([]);
            })
          );
        }
        
        return throwError(() => error);
      })
    );
  }

  // Upload CV
  uploadCV(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post(`${this.baseUrl}`, formData, {
      headers: this.getAuthHeaders()
    });
  }

  // Delete CV
  deleteCV(cvId: number): Observable<any> {
    console.log(`CV Service: Deleting CV with ID: ${cvId}`);
    console.log(`CV Service: Delete URL: ${this.baseUrl}/${cvId}`);
    
    // Try multiple endpoint variations to find the correct one
    const endpoints = [
      `${this.baseUrl}/${cvId}`,  // /api/MenteeCVs/{id}
      `${this.baseUrl}/delete/${cvId}`,  // /api/MenteeCVs/delete/{id}
      `https://localhost:7001/api/MenteeCVs/${cvId}`,  // Direct backend
      `https://localhost:7001/api/MenteeCVs/delete/${cvId}`  // Direct backend with delete path
    ];

    const tryEndpoint = (index: number): Observable<any> => {
      if (index >= endpoints.length) {
        return throwError(() => new Error('All delete endpoints failed'));
      }

      const endpoint = endpoints[index];
      console.log(`CV Service: Trying delete endpoint ${index + 1}/${endpoints.length}: ${endpoint}`);

      return this.http.delete(endpoint, {
        headers: this.getAuthHeaders()
      }).pipe(
        tap(response => {
          console.log(`CV Service: CV deleted successfully via endpoint: ${endpoint}`, response);
        }),
        catchError(error => {
          console.error(`CV Service: Delete failed for endpoint: ${endpoint}`, error);
          console.error(`CV Service: Error status: ${error.status}`);
          
          // If this endpoint failed, try the next one
          if (index < endpoints.length - 1) {
            console.log(`CV Service: Trying next endpoint...`);
            return tryEndpoint(index + 1);
          } else {
            console.error('CV Service: All delete endpoints failed');
            return throwError(() => error);
          }
        })
      );
    };

    return tryEndpoint(0);
  }

  // Get comments for a specific CV
  getCVComments(cvId: number): Observable<any[]> {
    console.log(`CV Service: Getting comments for CV ID: ${cvId}`);
    
    // Try direct backend call first since proxy seems to have issues with comments endpoint
    return this.http.get<any[]>(`https://localhost:7001/api/MenteeCVs/comments/${cvId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log(`CV Service: Direct comments response for CV ${cvId}:`, response);
      }),
      catchError(error => {
        console.error(`CV Service: Direct backend call failed for CV ${cvId} comments:`, error);
        
        // Fallback to proxy endpoint
        console.log(`CV Service: Trying proxy endpoint for CV ${cvId} comments...`);
        return this.http.get<any[]>(`${this.baseUrl}/comments/${cvId}`, {
          headers: this.getAuthHeaders(),
          responseType: 'json'
        }).pipe(
          tap(proxyResponse => {
            console.log(`CV Service: Proxy comments response for CV ${cvId}:`, proxyResponse);
          }),
          catchError(proxyError => {
            console.error(`CV Service: Proxy comments call also failed for CV ${cvId}:`, proxyError);
            console.error(`CV Service: Proxy error status: ${proxyError.status}`);
            console.error(`CV Service: Proxy error body:`, proxyError.error);
            
            return of([]); // Return empty array if both calls fail
          })
        );
      })
    );
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : new HttpHeaders();
  }
}
