  import { Injectable, NgZone } from '@angular/core';
  import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';
  import { HttpClient, HttpErrorResponse } from '@angular/common/http';

  import { TokenResponseDto } from '../Models/Auth/TokenResponseDto';
  import { RegisterDto } from '../Models/Auth/RegisterDto ';
  import { LoginDto } from '../Models/Auth/LoginDto';
  import { ExternalLoginDto } from '../Models/Auth/ExternalLoginDto';
  import { ForgotPasswordDto } from '../Models/Auth/ForgotPasswordDto';
  import { ResetPasswordDto } from '../Models/Auth/ResetPasswordDto';
  import { LogoutDto } from '../Models/Auth/LogoutDto';
  import { RegisterResponseDto } from '../Models/Auth/RegisterResponseDto';
import { environment } from '../environments/environment.development';

  @Injectable({
    providedIn: 'root'
  })
  export class AuthService {
    private apiUrl = `${environment.apiUrl}/Auth`;
    private currentUserSubject: BehaviorSubject<TokenResponseDto | null>;
    public currentUser: Observable<TokenResponseDto | null>;

    constructor(private http: HttpClient, private ngZone: NgZone) {
      const storedToken = localStorage.getItem('currentUser');
      this.currentUserSubject = new BehaviorSubject<TokenResponseDto | null>(storedToken ? JSON.parse(storedToken) : null);
      this.currentUser = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): TokenResponseDto | null {
      return this.currentUserSubject.value;
    }

    register(dto: RegisterDto): Observable<RegisterResponseDto> {
      return this.http.post<RegisterResponseDto>(`${this.apiUrl}/Register`, dto).pipe(

        catchError(this.handleError)
      );
    }

    login(dto: LoginDto): Observable<any> {
      // Temporary fix: Direct backend call
      return this.http.post('https://localhost:7001/api/Auth/login', dto).pipe(
        tap((response: any) => {
          if (response && response.tokenData) {
            this.setToken(response.tokenData);
          }
        }),
        catchError(this.handleError)
      );
    }


    externalLogin(dto: ExternalLoginDto): Observable<any> {
      return this.http.post(`${this.apiUrl}/ExternalLogin`, dto).pipe(
        tap((response: any) => {
          if (response && response.tokenData) {
            this.setToken(response.tokenData);
          }
        }),
        catchError(this.handleError)
      );
    }

    refreshToken(refreshToken: string): Observable<TokenResponseDto> {
      return this.http.post<any>(`${this.apiUrl}/RefreshToken`, JSON.stringify(refreshToken), {
        headers: { 'Content-Type': 'application/json' }
      }).pipe(
        map(response => response.tokenData),
        tap((tokenResponse: TokenResponseDto) => {
          this.setToken(tokenResponse);
        }),
        catchError(this.handleError)
      );
    }

    forgotPassword(dto: ForgotPasswordDto): Observable<any> {
      return this.http.post(`${this.apiUrl}/ForgotPassword`, dto).pipe(
        catchError(this.handleError)
      );
    }

   resetPassword(dto: ResetPasswordDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/ResetPassword`, dto, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }
  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify-email/${token}`, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

    resendVerificationEmail(email: string): Observable<any> {
      return this.http.post(`${this.apiUrl}/ResendVerificationEmail`, JSON.stringify(email), {
        headers: { 'Content-Type': 'application/json' }
      }).pipe(
        catchError(this.handleError)
      );
    }

    logout(): Observable<any> {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        this.clearToken();
        return new Observable(observer => { observer.next({ message: 'Logged out successfully locally.' }); observer.complete(); });
      }
      const logoutDto: LogoutDto = { refreshToken: refreshToken };
      return this.http.post(`${this.apiUrl}/logout`, logoutDto).pipe(
        tap(() => { this.clearToken(); }),
        catchError(this.handleError)
      );
    }

    private setToken(tokenData: TokenResponseDto): void {
      this.ngZone.run(() => {
        localStorage.setItem('currentUser', JSON.stringify(tokenData));
        this.currentUserSubject.next(tokenData);
      });
    }

    public clearToken(): void {
      this.ngZone.run(() => {
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
      });
    }

    getToken(): string | null {
      const currentUser = this.currentUserSubject.value;
      return currentUser ? currentUser.accessToken : null;
    }

    getRefreshToken(): string | null {
      const currentUser = this.currentUserSubject.value;
      return currentUser ? currentUser.refreshToken : null;
    }

    isLoggedIn(): boolean {
      return this.currentUserSubject.value !== null && !!this.currentUserSubject.value.accessToken;
    }

   private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ProgressEvent) {
      errorMessage = `Network error: Could not connect to the server. Please check your internet connection or try again later.`;
      console.error('Frontend/Network Error (ProgressEvent):', error);
    } else if (error.error && typeof error.error === 'string') {
      errorMessage = error.error;
      console.error('Backend returned string error or parsing issue:', error.error);
    } else if (error.error && typeof error.error === 'object') {
      if ((error.error as any).message) {
        errorMessage = (error.error as any).message;
      } else if ((error.error as any).errors) {
        errorMessage = Object.values((error.error as any).errors).flat().join('\n');
      } else {
        errorMessage = JSON.stringify(error.error);
      }
      console.error(`Backend returned object error:`, error.error);
    } else if (error.status) {
      errorMessage = `Server Error (${error.status}): ${error.message || error.statusText}`;
      console.error(`Backend returned code ${error.status}:`, error.error);
    } else {
      errorMessage = 'An unexpected client-side error occurred!';
      console.error('Unknown client-side error:', error);
    }
    console.error(`Error message from handleError:`, errorMessage);
    return throwError(() => new Error(errorMessage));
  }
  }
