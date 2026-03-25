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
import { Header } from "../common/header/header";

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

  readonly currentRaceIndex = computed(() => {
    const now = new Date();
    const list = this.races();

    // Find the first race that hasn't fully ended yet
    const idx = list.findIndex((r) => new Date(r.endDay) >= now);
    return idx === -1 ? list.length - 1 : idx;
  });

  ngOnInit(): void {
    this.fetchRaces();
  }

  onYearChange(newYear: string): void {
    this.selectedYear.set(newYear);
    this.fetchRaces();
  }

  retryFetch(): void {
    this.fetchRaces();
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