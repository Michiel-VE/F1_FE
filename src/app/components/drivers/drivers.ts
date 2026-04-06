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
import { DriverService } from '../../services/driver/driver-service';
import { Driver as DriverI } from '../../interfaces/driver';
import { ErrorState } from '../../interfaces/error-state';
import { finalize } from 'rxjs/operators';
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

  private readonly CACHE_KEY_PREFIX = 'f1_drivers_list_';

  readonly selectedYear = signal<string>(new Date().getFullYear().toString());
  readonly drivers = signal<DriverI[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<ErrorState | null>(null);

  year: string = new Date().getFullYear().toString();

  ngOnInit(): void {
    this.fetchDrivers();
  }

  onYearChange(newYear: string): void {
    this.selectedYear.set(newYear);
    this.fetchDrivers();
  }

  private fetchDrivers(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.driverService
      .getData<DriverI[]>(`${this.CACHE_KEY_PREFIX}${this.selectedYear()}`, this.selectedYear())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (data) => {
          this.drivers.set(data || []);
        },
        error: (err) => {
          this.error.set({
            message: this.extractErrorMessage(err, 'Error fetching drivers'),
            timestamp: new Date(),
            canRetry: true,
          });
        },
      });
  }

  retryFetch(): void {
    this.fetchDrivers();
  }

  private extractErrorMessage(err: HttpErrorResponse, title: string): string {
    if (typeof err === 'string') return `${title}: ${err}`;
    if (err?.message) return `${title}: ${err.status} ${err.statusText}`;
    return `${title} data. Please try again.`;
  }
}