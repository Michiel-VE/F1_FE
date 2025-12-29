import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import localForage from 'localforage';
import { from, Observable, of } from 'rxjs';
import { CacheEntry } from '../../interfaces/cache-entry';

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      localForage.config({
        name: 'F1AppCache',
        storeName: 'drivers_current_year',
      });
    } else {
      console.warn('[CacheService] Running in non-browser environment (SSR/Node). Caching disabled.');
    }
  }

  getItem<T>(key: string): Observable<CacheEntry<T> | null> {
    if (!this.isBrowser) {
        return of(null);
    }
    return from(localForage.getItem<CacheEntry<T>>(key));
  }

  setItem<T>(key: string, entry: CacheEntry<T>): Promise<T> {
    if (!this.isBrowser) {
        return Promise.resolve(entry.data);
    }
    
    return localForage.setItem(key, entry)
      .then(() => entry.data);
  }

  clear(): Promise<void> {
    if (!this.isBrowser) {
        return Promise.resolve();
    }
    return localForage.clear();
  }
}