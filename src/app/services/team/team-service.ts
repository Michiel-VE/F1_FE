import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { CacheEntry } from '../../interfaces/cache-entry';
import { PersistentCacheService  } from '../cache/cache-service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private http = inject(HttpClient);
  private cacheService = inject(PersistentCacheService );

  private readonly DAYLIST: Record<string, number> = {
    Sunday: 0,
    Saturday: 6,
  };

  private getCurrentYear = (): string => new Date().getFullYear().toString();

  private buildUrl(year: string): string {
    return `${environment.baseUrl}/teams/${year}`;
  }

  private isDataReloadNecessary(lastReloadTimestamp: number): boolean {
    const now = new Date();
    const lastReloadDate = new Date(lastReloadTimestamp);

    const SATURDAY = this.DAYLIST['Saturday'];

    const requiredReloadTime = new Date(now);
    requiredReloadTime.setHours(3, 0, 0, 0);

    const todayDay = now.getDay();

    const daysSinceLastSaturday = (todayDay - SATURDAY + 7) % 7;

    requiredReloadTime.setDate(requiredReloadTime.getDate() - daysSinceLastSaturday);

    if (now.getHours() < 3 && (todayDay === SATURDAY || todayDay === this.DAYLIST['Sunday'])) {
      requiredReloadTime.setDate(requiredReloadTime.getDate() - 7);
    }

    return lastReloadDate.getTime() < requiredReloadTime.getTime();
  }

  getData<T>(key: string, year: string = this.getCurrentYear()): Observable<T> {
    return this.cacheService.getItem<T>(key).pipe(
      switchMap((entry) => {
        const cacheExpiredOrMissing = !entry || this.isDataReloadNecessary(entry.timestamp);

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
    console.log(`[TeamService] Fetching data for key ${key} from API. year: ${year}, endpoint: ${url}`);

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
        console.error(`[TeamService] Error fetching data from ${url}:`, error);
        throw error;
      }),
    );
  }
}