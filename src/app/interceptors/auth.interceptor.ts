import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService, SILENT_AUTH_CHECK } from '../services/auth/auth-service';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only treat a 401 as "your session expired" when the user WAS logged in and
      // the failing request is not the silent "am I logged in?" probe. Anonymous
      // visitors (and wrong-password logins) also get 401s; those must not
      // trigger a logout or a redirect.
      const sessionExpired =
        error.status === 401 && !req.context.get(SILENT_AUTH_CHECK) && authService.isAuthenticated();

      if (sessionExpired) {
        authService.clearSession();
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => error);
    }),
  );
};