import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DriverDataResponse } from '../../interfaces/driver-data-response';
import { DriverHistoricalData } from '../../interfaces/driver-historical-data';
import { MemoryCacheService } from '../cache/memory-cache';

const TTL_MS = 12 * 60 * 60 * 1000;
const REGULATION_RESET_YEARS = [2022, 2026];
const HISTORY_WINDOW = 2;

@Injectable({ providedIn: 'root' })
export class DriverResultService {
  private http = inject(HttpClient);
  private cache = inject(MemoryCacheService);
  private readonly BASE_URL = environment.baseUrl;

  getRaceResults(driverId: string, season: string): Observable<DriverDataResponse> {
    const key = `race-results:${driverId}:${season}`;
    const cached = this.cache.get<DriverDataResponse>(key);

    if (cached) return of(cached);

    return this.http
      .get<DriverDataResponse>(`${this.BASE_URL}/drivers/${driverId}/race-results`, {
        params: { season },
      })
      .pipe(tap((res) => this.cache.set(key, res, TTL_MS)));
  }

  getRaceResultsWithHistory(
    driverId: string,
    currentSeason: string,
  ): Observable<DriverHistoricalData> {
    const current = parseInt(currentSeason, 10);

    const pastSeasons: number[] = [];
    for (let i = 1; i <= HISTORY_WINDOW; i++) {
      const year = current - i;
      if (REGULATION_RESET_YEARS.includes(year + 1)) break;
      pastSeasons.push(year);
    }

    const current$ = this.getRaceResults(driverId, currentSeason);

    if (!pastSeasons.length) {
      return current$.pipe(map((current) => ({ current, historical: [], historicalAvg: 0 })));
    }

    const weights = pastSeasons.map((_, i) => {
      const steps = pastSeasons.length;
      return (steps - i) / pastSeasons.reduce((acc, __, j) => acc + (steps - j), 0);
    });

    const historical$ = pastSeasons.map((y) =>
      this.getRaceResults(driverId, y.toString()).pipe(
        catchError(() => of({ firstname: '', lastname: '', season: y.toString(), results: [] })),
      ),
    );

    return forkJoin([current$, ...historical$]).pipe(
      map(([current, ...historical]) => {
        const validSeasons = historical
          .map((h, i) => {
            if (!h.results.length) return null;
            const avg = h.results.reduce((acc, r) => acc + r.points, 0) / h.results.length;
            return { avg, weight: weights[i] };
          })
          .filter((s): s is { avg: number; weight: number } => s !== null);

        const historicalAvg = validSeasons.length
          ? validSeasons.reduce((acc, s) => acc + s.avg * s.weight, 0) /
            validSeasons.reduce((acc, s) => acc + s.weight, 0)
          : 0;

        return { current, historical, historicalAvg };
      }),
    );
  }
}
