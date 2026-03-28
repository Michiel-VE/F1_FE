import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  readonly isAuthenticated = computed(() => !!this._token());

  private readonly _token = signal<string | null>(
    isPlatformBrowser(this.platformId) ? localStorage.getItem('auth_token') : null,
  );

  setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('auth_token', token);
    }
    this._token.set(token);
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
    }
    this._token.set(null);
  }

  getToken(): string | null {
    return this._token();
  }

  isTokenExpiringSoon(): boolean {
    const token = this._token();
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);

      return decoded.exp - currentTime < 300;
    } catch (e) {
      return true;
    }
  }
}
