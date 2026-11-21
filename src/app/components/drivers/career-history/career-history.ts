import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  switchMap,
  tap,
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DriverService } from '../../../services/driver/driver-service';
import { ModalService } from '../../../services/modal/modal';
import { DriverResult } from '../../drivers/driver-result/driver-result';
import { Driver } from '../../../interfaces/driver';
import { TeamSeason } from '../../../interfaces/team-season';
import { ErrorState } from '../../../interfaces/error-state';
import { Error as ErrorBanner } from '../../common/error/error';

@Component({
  selector: 'app-career-history',
  standalone: true,
  imports: [DatePipe, ErrorBanner],
  templateUrl: './career-history.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareerHistory implements OnInit {
  private driverService = inject(DriverService);
  private modalService = inject(ModalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private searchInput$ = new Subject<string>();

  readonly searchResults = signal<Driver[]>([]);
  readonly isSearching = signal<boolean>(false);
  readonly selectedDriver = signal<Driver | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<ErrorState | null>(null);
  readonly searchQuery = signal<string>('');
  readonly fromLandingPage = signal<boolean>(false);

  readonly sortedSeasons = computed<TeamSeason[]>(() => {
    const seasons = this.selectedDriver()?.teamSeasons ?? [];
    return [...seasons].sort((a, b) => Number(b.seasonName) - Number(a.seasonName));
  });

  readonly totalPoints = computed<number>(() =>
    this.sortedSeasons().reduce((sum, s) => sum + (s.points ?? 0), 0),
  );

  readonly distinctTeams = computed<string[]>(() => {
    const seen = new Set<string>();
    for (const s of this.sortedSeasons()) {
      if (s.teamName) seen.add(s.teamName);
    }
    return Array.from(seen);
  });

  readonly filteredDrivers = computed<Driver[]>(() => {
    if (!this.searchQuery().trim()) return [];
    return this.searchResults().slice(0, 8);
  });

  constructor() {
    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((raw) => {
          const trimmed = raw.trim();
          this.searchQuery.set(raw);
          if (trimmed.length < 2) {
            this.searchResults.set([]);
            this.isSearching.set(false);
          } else {
            this.isSearching.set(true);
          }
        }),
        switchMap((raw) => {
          const trimmed = raw.trim();
          if (trimmed.length < 2) {
            return of([] as Driver[]);
          }
          return this.driverService.searchDrivers(trimmed).pipe(
            catchError(() => of([] as Driver[])),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      });
  }

  ngOnInit(): void {
    const initialLastName = this.route.snapshot.paramMap.get('lastName');
    const isLanding = Boolean(
      this.router.getCurrentNavigation()?.extras.state?.['random'] ??
        (typeof window !== 'undefined' && window.history.state?.['random']),
    );
    this.fromLandingPage.set(isLanding);
    this.loadInitialData(initialLastName, isLanding);
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchInput$.next(value);
  }

  private loadInitialData(initialLastName: string | null, isLanding: boolean): void {
    this.error.set(null);
    this.selectedDriver.set(null);

    if (initialLastName) {
      this.fetchHistory(initialLastName);
      return;
    }

    if (isLanding) {
      this.isLoading.set(true);
      this.driverService.getAllDrivers().subscribe({
        next: (drivers) => {
          this.pickRandomDriver(drivers);
        },
        error: () => {
          this.isLoading.set(false);
          this.error.set({
            message: 'Failed to load drivers list.',
            canRetry: true,
            timestamp: new Date(),
          });
        },
      });
    } else {
      this.isLoading.set(false);
    }
  }

  pickRandomDriver(pool?: Driver[]): void {
    if (pool?.length) {
      this.selectRandomFromPool(pool);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.driverService.getAllDrivers().subscribe({
      next: (drivers) => {
        this.selectRandomFromPool(drivers);
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set({
          message: 'Failed to load drivers list.',
          canRetry: true,
          timestamp: new Date(),
        });
      },
    });
  }

  private selectRandomFromPool(pool: Driver[]): void {
    if (!pool.length) {
      this.isLoading.set(false);
      return;
    }

    const currentId = this.selectedDriver()?.driverId;
    const candidates = pool.length > 1 ? pool.filter((d) => d.driverId !== currentId) : pool;
    const random = candidates[Math.floor(Math.random() * candidates.length)];

    this.selectDriver(random);
  }

  selectDriver(driver: Driver): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.router.navigate(['/drivers/career-history', driver.lastname], {
      replaceUrl: true,
      state: { random: this.fromLandingPage() },
    });
    this.fetchHistory(driver.lastname, driver.driverId);
  }

  openSeasonStats(season: TeamSeason): void {
    const driver = this.selectedDriver();
    if (!driver) return;

    this.modalService.open(DriverResult, {
      driver,
      selectedYear: season.seasonName,
      availableYears: [season.seasonName],
    });
  }

  private fetchHistory(lastName: string, preferredDriverId?: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.driverService
      .getDriverCareerHistory(lastName)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (matches) => {
          if (!matches?.length) {
            this.selectedDriver.set(null);
            this.error.set({
              message: `No career history found for "${lastName}".`,
              canRetry: false,
              timestamp: new Date(),
            });
            return;
          }

          const exact = preferredDriverId
            ? matches.find((d) => d.driverId === preferredDriverId)
            : undefined;
          this.selectedDriver.set(exact ?? matches[0]);
        },
        error: () => {
          this.error.set({
            message: 'Failed to load driver career history.',
            canRetry: true,
            timestamp: new Date(),
          });
        },
      });
  }

  retry(): void {
    const current = this.selectedDriver();
    if (current) {
      this.fetchHistory(current.lastname, current.driverId);
    } else {
      this.loadInitialData(this.route.snapshot.paramMap.get('lastName'), this.fromLandingPage());
    }
  }
}