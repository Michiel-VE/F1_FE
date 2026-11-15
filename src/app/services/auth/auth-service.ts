import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap, switchMap, finalize, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../../interfaces/user';

/**
 * Marks the "am I logged in?" request. A 401 on it is a normal answer for a
 * visitor who is not logged in, not an expired session, so the interceptor must
 * not log out or redirect because of it.
 */
export const SILENT_AUTH_CHECK = new HttpContextToken<boolean>(() => false);

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);

  private readonly _isAuthenticated = signal<boolean | null>(null);
  private readonly _currentUser = signal<User | null>(null);

  // The check currently running, so several callers (guard, navbar, login page)
  // share one request instead of each sending their own.
  private inflightCheck$: Observable<boolean> | null = null;

  readonly isAuthenticated = computed(() => this._isAuthenticated() === true);
  readonly authChecked = computed(() => this._isAuthenticated() !== null);
  readonly currentUser = this._currentUser.asReadonly();

  checkAuth(): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(false);
    }
    if (this.inflightCheck$) {
      return this.inflightCheck$;
    }

    this.inflightCheck$ = this.http
      .get<User>(`${environment.baseUrl}/profile`, {
        withCredentials: true,
        context: new HttpContext().set(SILENT_AUTH_CHECK, true),
      })
      .pipe(
        map((user) => {
          this._currentUser.set(user);
          return true;
        }),
        catchError(() => {
          this._currentUser.set(null);
          return of(false);
        }),
        tap((isAuth) => this._isAuthenticated.set(isAuth)),
        finalize(() => {
          this.inflightCheck$ = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.inflightCheck$;
  }

  loginWithCredentials(email: string, password: string): Observable<void> {
    return this.http
      .post<void>(
        `${environment.baseUrl}/auth/login`,
        { email, password },
        { withCredentials: true },
      )
      .pipe(
        switchMap(() => this.checkAuth()),
        map(() => void 0),
      );
  }

  /** User clicked "log out": ask the server to clear the cookie, then clear local state. */
  logout(): Observable<void> {
    return this.http
      .post<void>(`${environment.baseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => this.clearSession()),
        map(() => void 0),
        catchError(() => {
          this.clearSession();
          return of(void 0);
        }),
      );
  }

  /** Forget the session locally only (no server call). Used when the session has expired. */
  clearSession(): void {
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
  }

  setAuthenticated(): void {
    this._isAuthenticated.set(true);
  }
}