import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post('https://localhost:7001/api/Auth/login', { email, password });
  }

  saveToken(token: string) {
    localStorage.setItem('accessToken', token);
    document.cookie = `authToken=${token}; path=/;`;
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getMenteeIdFromToken(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Try both 'nameid' and 'menteeId' for compatibility
      return payload.nameid ? +payload.nameid : (payload.menteeId ? +payload.menteeId : null);
    } catch {
      return null;
    }
  }
}
