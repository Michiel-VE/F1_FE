import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  DestroyRef,
  ChangeDetectorRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DriverService } from '../../services/driver/driver-service';
import { Driver } from '../../interfaces/driver';
import { AgePipe } from '../../pipe/age/age-pipe';
import { finalize } from 'rxjs/operators';
import { Search } from './search/search';

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [CommonModule, AgePipe, Search],
  templateUrl: './drivers.html',
  styleUrls: ['./drivers.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Drivers implements OnInit {
  private driverService = inject(DriverService);
  private destroyRef = inject(DestroyRef);
  private changeDetectorRef = inject(ChangeDetectorRef);

  protected year = new Date().getFullYear().toString();
  drivers = signal<Driver[]>([]);
  isLoading = true;

  ngOnInit(): void {
    this.fetchDrivers();
  }

  onYearChange(newYear: string): void {
    this.year = newYear;
    this.fetchDrivers();
  }

  fetchDrivers(): void {
    this.isLoading = true;
    this.changeDetectorRef.markForCheck();

    this.driverService
      .getData<Driver[]>(`f1_drivers_list_${this.year}`, this.year)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        }),
      )
      .subscribe({
        next: (data) => {
          this.drivers.set(data || []);
        },
        error: (err) => {
          console.error('Error fetching drivers data:', err);
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
      });
  }
}