import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  DestroyRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { RaceService } from '../../services/race/race-service';
import { Race } from '../../interfaces/race';
import { ErrorState } from '../../interfaces/error-state';
import { RaceCard } from './race/race';
import { Header } from '../common/header/header';

@Component({
  selector: 'app-races',
  standalone: true,
  imports: [CommonModule, RaceCard, Header],
  templateUrl: './races.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Races implements OnInit {
  private readonly raceService = inject(RaceService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedYear = signal<string>(new Date().getFullYear().toString());
  year: string = new Date().getFullYear().toString();

  readonly races = signal<Race[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<ErrorState | null>(null);
  readonly pastExpanded = signal(false);

  readonly isCurrentYear = computed(
    () => this.selectedYear() === new Date().getFullYear().toString(),
  );

  private readonly isRaceRound = (race: Race): boolean => !/pre-season|testing/i.test(race.name);

  readonly roundNumbers = computed(() => {
    const map = new Map<string, number>();
    let round = 0;
    for (const race of this.races()) {
      if (this.isRaceRound(race)) {
        map.set(race.id, ++round);
      } else {
        map.set(race.id, 0);
      }
    }
    return map;
  });

  readonly nextUpRace = computed(
    () => this.races().find((r) => this.isUpcoming(r) || this.isCurrentRace(r)) ?? null,
  );

  readonly pastRaces = computed(() => this.races().filter((r) => this.isPast(r)));
  readonly pastCount = computed(() => this.pastRaces().length);

  /** Last 1 past races shown as hint when collapsed */
  readonly hintRaces = computed(() => this.pastRaces().slice(-1));

  readonly visibleRaces = computed(() => {
    if (!this.isCurrentYear()) return this.races();
    const upcoming = this.races().filter((r) => !this.isPast(r));
    if (this.pastExpanded()) return this.races();
    return [...this.hintRaces(), ...upcoming];
  });

  /** How many past races are hidden (total past minus the 1 hint) */
  readonly hiddenPastCount = computed(() => {
    if (!this.isCurrentYear() || this.pastExpanded()) return 0;
    return Math.max(0, this.pastCount() - 1);
  });

  /** The id of the last hint race — button renders right after this one */
  readonly lastHintRaceId = computed(() => {
    const hints = this.hintRaces();
    return hints.length > 0 ? hints[hints.length - 1].id : null;
  });

  ngOnInit(): void {
    this.fetchRaces();
  }

  onYearChange(newYear: string): void {
    this.selectedYear.set(newYear);
    this.pastExpanded.set(false);
    this.fetchRaces();
  }

  retryFetch(): void {
    this.fetchRaces();
  }

  togglePast(): void {
    this.pastExpanded.update((v) => !v);
  }

  isCurrentRace(race: Race): boolean {
    const now = new Date();
    return new Date(race.startDay) <= now && new Date(race.endDay) >= now;
  }

  isUpcoming(race: Race): boolean {
    return new Date(race.startDay) > new Date();
  }

  isPast(race: Race): boolean {
    return new Date(race.endDay) < new Date();
  }

  getRoundNumber(race: Race): number {
    return this.roundNumbers().get(race.id) ?? 0;
  }

  private fetchRaces(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const year = this.selectedYear();
    const cacheKey = `f1_races_${year}`;

    this.raceService
      .getData<Race[]>(cacheKey, year)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (data) => this.races.set(data || []),
        error: (err) => {
          this.error.set({
            message: this.extractErrorMessage(err),
            timestamp: new Date(),
            canRetry: true,
          });
          console.error('[Races] Error fetching races:', err);
        },
      });
  }

  private extractErrorMessage(err: Error): string {
    if (typeof err === 'string') return err;
    if (err?.message) return err.message;
    return 'Failed to fetch races. Please try again.';
  }
}
