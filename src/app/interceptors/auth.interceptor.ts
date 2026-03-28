import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth-service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const protectedPaths = ['/api/v1/profile', '/api/v1/prediction', '/api/v1/prediction/team'];
  const isProtected = protectedPaths.some(path => req.url.includes(path));

  let authReq = req;

  if (token && isProtected) {
    if (authService.isTokenExpiringSoon()) {
      authService.logout();
      router.navigate(['/login']);
      return next(req);
    }

    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isProtected) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};