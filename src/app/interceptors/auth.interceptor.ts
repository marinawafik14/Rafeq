import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../Services/auth.service';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

function addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();
    if (refreshToken) {
      return authService.refreshToken(refreshToken).pipe(
        switchMap((tokenResponse: any) => {
          isRefreshing = false;
          refreshTokenSubject.next(tokenResponse.accessToken);
          return next(addToken(request, tokenResponse.accessToken));
        }),
        catchError((err: any) => {
          isRefreshing = false;
          authService.clearToken();
          router.navigate(['/login']);
          console.error('Refresh token failed. User logged out automatically:', err);
          return throwError(() => err);
        }),
        finalize(() => {
          isRefreshing = false;
        })
      );
    } else {
      isRefreshing = false;
      authService.clearToken();
      router.navigate(['/login']);
      console.warn('No refresh token found. User logged out automatically.');
      return throwError(() => new Error('Refresh token not available. Logging out.'));
    }
  } else {
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => next(addToken(request, token)))
    );
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth for OpenAI API requests
  if (req.context.has('skipAuth' as any) || 
      req.url.includes('openai.com') || 
      req.url.includes('api.openai.com')) {
    return next(req);
  }

  const accessToken = authService.getToken();

  if (accessToken) {
    req = addToken(req, accessToken);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 and not an auth route, handle refresh
      if (
        error.status === 401 &&
        !(req.url.includes('login') ||
          req.url.includes('Register') ||
          req.url.includes('ExternalLogin') ||
          req.url.includes('RefreshToken') ||
          req.url.includes('logout') ||
          req.url.includes('ForgotPassword') ||
          req.url.includes('ResetPassword') ||
          req.url.includes('verify-email') ||
          req.url.includes('ResendVerificationEmail'))
      ) {
        return handle401Error(req, next, authService, router);
      }

      // For auth routes with 401, just pass through
      if (error.status === 401) {
        return throwError(() => error);
      }

      // If 403 Forbidden, log out and redirect to login
      if (error.status === 403) {
        authService.clearToken();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      return throwError(() => error);
    })
  );
};
