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
import { trigger, transition, style, animate } from '@angular/animations';
import { RaceService } from '../../services/race/race-service';
import { Race } from '../../interfaces/race';
import { ErrorState } from '../../interfaces/error-state';
import { RaceCard } from './race/race';
import { Header } from '../common/header/header';
import { Error as ErrorComponent } from '../common/error/error';
import { HttpErrorResponse } from '@angular/common/http';
import { RaceStatus } from '../../enum/race-status';

@Component({
  selector: 'app-races',
  standalone: true,
  imports: [CommonModule, RaceCard, Header, ErrorComponent],
  templateUrl: './races.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ height: '0px', opacity: 0, overflow: 'hidden' }),
        animate('350ms ease-out', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        style({ height: '*', overflow: 'hidden' }),
        animate('300ms ease-in', style({ height: '0px', opacity: 0 })),
      ]),
    ]),
  ],
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
    () =>
      this.races().find(
        (r) =>
          (this.isUpcoming(r) || this.isCurrentRace(r)) &&
          r.status !== RaceStatus.CANCELLED &&
          r.status !== RaceStatus.POSTPONED,
      ) ?? null,
  );

  readonly pastRaces = computed(() => this.races().filter((r) => this.isPast(r)));
  readonly pastCount = computed(() => this.pastRaces().length);

  readonly hintRaces = computed(() => this.pastRaces().slice(-1));

  readonly visibleRaces = computed(() => {
    if (!this.isCurrentYear()) return this.races();
    const upcoming = this.races().filter((r) => !this.isPast(r));
    if (this.pastExpanded()) return this.races();
    return [...this.hintRaces(), ...upcoming];
  });

  readonly hiddenPastCount = computed(() => {
    if (!this.isCurrentYear() || this.pastExpanded()) return 0;
    return Math.max(0, this.pastCount() - 1);
  });

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

  private parseLocalDate(dateStr: string, isEnd: boolean = false): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (isEnd) {
      return new Date(year, month - 1, day, 23, 59, 59, 999);
    }
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  isCurrentRace(race: Race): boolean {
    const now = new Date();
    const start = this.parseLocalDate(race.startDay, false);
    const end = this.parseLocalDate(race.endDay, true);
    return now >= start && now <= end;
  }

  isUpcoming(race: Race): boolean {
    const now = new Date();
    const start = this.parseLocalDate(race.startDay, false);
    return start > now;
  }

  isPast(race: Race): boolean {
    const now = new Date();
    const end = this.parseLocalDate(race.endDay, true);
    return end < now;
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
            message: this.extractErrorMessage(err, 'Error fetching races'),
            timestamp: new Date(),
            canRetry: true,
          });
        },
      });
  }

  private extractErrorMessage(err: HttpErrorResponse, title: string): string {
    if (typeof err === 'string') return `${title}: ${err}`;
    if (err?.message) return `${title}: ${err.status} ${err.statusText}`;
    return `${title} data. Please try again.`;
  }
}