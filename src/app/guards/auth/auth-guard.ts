import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // The server has no access to the browser's login cookie, so it can't know
  // whether the visitor is logged in. Let the page through there; the guard runs
  // again in the browser and redirects if needed. Without this, opening any
  // protected page directly was redirected to /login by the server.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const toLogin = () =>
    router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });

  if (authService.authChecked()) {
    return authService.isAuthenticated() ? true : toLogin();
  }

  return authService.checkAuth().pipe(map((isAuth) => (isAuth ? true : toLogin())));
};