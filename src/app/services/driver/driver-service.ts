import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MemoryCacheService } from '../cache/memory-cache';
import { Driver } from '../../interfaces/driver';

@Injectable({ providedIn: 'root' })
export class DriverService {
  private http = inject(HttpClient);
  private cache = inject(MemoryCacheService);
  private readonly CACHE_TTL = 60 * 60 * 1000;

  getData<T>(key: string, year: string = new Date().getFullYear().toString()): Observable<T> {
    const cached = this.cache.get<T>(key);
    if (cached) return of(cached);

    const url = `${environment.baseUrl}/drivers/season/${year}`;
    return this.http.get<T>(url).pipe(
      tap((data) => {
        if (data) this.cache.set(key, data, this.CACHE_TTL);
      }),
    );
  }

  searchDrivers(query: string): Observable<Driver[]> {
    const trimmed = query.trim();
    if (!trimmed) return of([]);

    const key = `drivers:search:${trimmed.toLowerCase()}`;
    const cached = this.cache.get<Driver[]>(key);
    if (cached) return of(cached);

    const params = new HttpParams().set('q', trimmed);
    return this.http.get<Driver[]>(`${environment.baseUrl}/drivers`, { params }).pipe(
      tap((data) => {
        if (data) this.cache.set(key, data, this.CACHE_TTL);
      }),
    );
  }

  getAllDrivers(): Observable<Driver[]> {
    const key = 'drivers:all';
    const cached = this.cache.get<Driver[]>(key);
    if (cached) return of(cached);

    return this.http.get<Driver[]>(`${environment.baseUrl}/drivers`).pipe(
      tap((data) => {
        if (data?.length) this.cache.set(key, data, this.CACHE_TTL);
      }),
    );
  }

  getDriverCareerHistory(lastName: string): Observable<Driver[]> {
    const normalized = lastName.trim().toLowerCase();
    const key = `drivers:career:${normalized}`;
    const cached = this.cache.get<Driver[]>(key);
    if (cached) return of(cached);

    const encoded = encodeURIComponent(lastName.trim());
    return this.http
      .get<Driver[]>(`${environment.baseUrl}/drivers/name/${encoded}/career-history`)
      .pipe(
        tap((data) => {
          if (data?.length) this.cache.set(key, data, this.CACHE_TTL);
        }),
      );
  }
}
