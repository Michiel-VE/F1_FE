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
import { Driver } from '../../interfaces/driver';
import { ErrorState } from '../../interfaces/error-state';
import { AgePipe } from '../../pipe/age/age-pipe';
import { finalize } from 'rxjs/operators';
import { Search } from './search/search';
import { TeamInfo } from '../../interfaces/team-info';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [CommonModule, AgePipe, Search],
  templateUrl: './drivers.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Drivers implements OnInit {
  private readonly driverService = inject(DriverService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly CACHE_KEY_PREFIX = 'f1_drivers_list_';

  readonly selectedYear = signal<string>(new Date().getFullYear().toString());
  readonly drivers = signal<Driver[]>([]);
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
      .getData<Driver[]>(
        `${this.CACHE_KEY_PREFIX}${this.selectedYear()}`,
        this.selectedYear()
      )
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (data) => {
          this.drivers.set(data || []);
        },
        error: (err) => {
          const errorState: ErrorState = {
            message: this.extractErrorMessage(err),
            timestamp: new Date(),
            canRetry: true,
          };
          this.error.set(errorState);
          console.error('Error fetching drivers:', err);
        },
      });
  }

  retryFetch(): void {
    this.fetchDrivers();
  }

  getTeamInfo(driver: Driver): TeamInfo {
    const team = driver.teamSeasons?.[0];
    return {
      name: team?.teamName ?? 'Unknown Team',
      shortName: team?.shortName ?? 'N/A',
    };
  }

  getPoints(driver: Driver): number {
    return driver.teamSeasons?.[0]?.points ?? 0;
  }

  private extractErrorMessage(err: Error): string {
    if (typeof err === 'string') {
      return err;
    }
    if (err?.message) {
      return err.message;
    }
    return 'Failed to fetch drivers data. Please try again.';
  }
}