import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MemoryCacheService } from '../cache/memory-cache';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);
  private cache = inject(MemoryCacheService);
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  getData<T>(key: string, year: string = new Date().getFullYear().toString()): Observable<T> {
    const cached = this.cache.get<T>(key);
    if (cached) return of(cached);

    const url = `${environment.baseUrl}/teams/${year}`;
    return this.http.get<T>(url).pipe(
      tap(data => {
        if (data) this.cache.set(key, data, this.CACHE_TTL);
      })
    );
  }
}