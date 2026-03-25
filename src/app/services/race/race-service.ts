import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { CacheEntry } from '../../interfaces/cache-entry';
import { CacheService } from '../cache/cache-service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RaceService {
  private http = inject(HttpClient);
  private cacheService = inject(CacheService);

  private readonly CACHE_DURATION_MS = 3 * 30 * 24 * 60 * 60 * 1000; // 3 months

  private getCurrentYear = (): string => new Date().getFullYear().toString();

  private buildUrl(year: string): string {
    return `${environment.driversBaseUrl}/races/${year}`;
  }

  private isCacheExpired(lastReloadTimestamp: number): boolean {
    return Date.now() - lastReloadTimestamp > this.CACHE_DURATION_MS;
  }

  getData<T>(key: string, year: string = this.getCurrentYear()): Observable<T> {
    return this.cacheService.getItem<T>(key).pipe(
      switchMap((entry) => {
        const cacheExpiredOrMissing = !entry || this.isCacheExpired(entry.timestamp);

        if (!cacheExpiredOrMissing) {
          return of(entry!.data);
        } else {
          return this.fetchAndCacheData<T>(key, year);
        }
      }),
    );
  }

  private fetchAndCacheData<T>(key: string, year: string): Observable<T> {
    const url = this.buildUrl(year);
    console.log(`[RaceService] Fetching data for key ${key} from API. year: ${year}, endpoint: ${url}`);

    return this.http.get<T>(url).pipe(
      tap((data) => {
        if (data === null || data === undefined) return;
        const newEntry: CacheEntry<T> = {
          data: data,
          timestamp: Date.now(),
        };
        this.cacheService
          .setItem(key, newEntry)
          .catch((error) => console.error(`[Cache] Failed to save data for key ${key}:`, error));
      }),
      catchError((error) => {
        console.error(`[RaceService] Error fetching data from ${url}:`, error);
        throw error;
      }),
    );
  }
}