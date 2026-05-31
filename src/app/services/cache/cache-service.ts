import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { CacheEntry } from '../../interfaces/cache-entry';

@Injectable({
  providedIn: 'root',
})
export class PersistentCacheService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private readonly STORE_PREFIX = 'F1AppCache_';

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (!this.isBrowser) {
      console.warn('[CacheService] Running in non-browser environment (SSR/Node). Caching disabled.');
    }
  }

  getItem<T>(key: string): Observable<CacheEntry<T> | null> {
    if (!this.isBrowser) return of(null);
    try {
      const raw = localStorage.getItem(this.STORE_PREFIX + key);
      return of(raw ? JSON.parse(raw) as CacheEntry<T> : null);
    } catch {
      return of(null);
    }
  }

  setItem<T>(key: string, entry: CacheEntry<T>): Promise<T> {
    if (!this.isBrowser) return Promise.resolve(entry.data);
    try {
      localStorage.setItem(this.STORE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      console.error('[CacheService] Failed to save to localStorage:', e);
    }
    return Promise.resolve(entry.data);
  }

  clear(): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.STORE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
    return Promise.resolve();
  }
}