import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../../interfaces/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);

  private readonly _isAuthenticated = signal<boolean | null>(null);
  private readonly _currentUser = signal<User | null>(null);

  readonly isAuthenticated = computed(() => this._isAuthenticated() === true);
  readonly authChecked = computed(() => this._isAuthenticated() !== null);
  readonly currentUser = this._currentUser.asReadonly();

  checkAuth(): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(false);
    }

    return this.http.get<User>(`${environment.baseUrl}/profile`, { withCredentials: true }).pipe(
      map((user) => {
        this._currentUser.set(user);
        return true;
      }),
      catchError(() => of(false)),
      tap((isAuth) => this._isAuthenticated.set(isAuth)),
    );
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

  logout(): Observable<void> {
    return this.http
      .post<void>(`${environment.baseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this._isAuthenticated.set(false);
          this._currentUser.set(null);
        }),
        catchError(() => {
          this._isAuthenticated.set(false);
          this._currentUser.set(null);
          return of(void 0);
        }),
      );
  }

  setAuthenticated(): void {
    this._isAuthenticated.set(true);
  }
}
