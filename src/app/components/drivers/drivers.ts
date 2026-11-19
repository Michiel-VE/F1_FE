import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  DestroyRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, of, switchMap, tap } from 'rxjs';
import { DriverService } from '../../services/driver/driver-service';
import { Driver as DriverI } from '../../interfaces/driver';
import { ErrorState } from '../../interfaces/error-state';
import { Header } from '../common/header/header';
import { Driver } from './driver/driver';
import { Error as ErrorComponent } from '../common/error/error';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [CommonModule, Header, Driver, ErrorComponent],
  templateUrl: './drivers.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Drivers implements OnInit {
  private readonly driverService = inject(DriverService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly yearChanges$ = new Subject<string>();

  private readonly CACHE_KEY_PREFIX = 'f1_drivers_list_';

  readonly selectedYear = signal<string>(new Date().getFullYear().toString());
  readonly drivers = signal<DriverI[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<ErrorState | null>(null);

  year: string = new Date().getFullYear().toString();

  constructor() {
    this.yearChanges$
      .pipe(
        tap((newYear) => {
          this.year = newYear;
          this.selectedYear.set(newYear);
          this.drivers.set([]);
          this.isLoading.set(true);
          this.error.set(null);
        }),
        switchMap((newYear) =>
          this.driverService
            .getData<DriverI[] | null>(`${this.CACHE_KEY_PREFIX}${newYear}`, newYear)
            .pipe(
              catchError((err: HttpErrorResponse) => {
                if (err.status === 404 || err.status === 204) {
                  return of([] as DriverI[]);
                }
                this.error.set({
                  message: this.extractErrorMessage(err, 'Error fetching drivers'),
                  timestamp: new Date(),
                  canRetry: true,
                });
                return of(null);
              }),
            ),
        ),
        tap(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        if (data !== null) {
          this.drivers.set(Array.isArray(data) ? data : []);
        }
      });
  }

  ngOnInit(): void {
    this.yearChanges$.next(this.selectedYear());
  }

  onYearChange(newYear: string): void {
    if (!newYear) return;
    this.yearChanges$.next(newYear);
  }

  retryFetch(): void {
    this.yearChanges$.next(this.selectedYear());
  }

  private extractErrorMessage(err: HttpErrorResponse, title: string): string {
    if (typeof err === 'string') return `${title}: ${err}`;
    if (err?.message) return `${title}: ${err.status} ${err.statusText}`;
    return `${title} data. Please try again.`;
  }
}