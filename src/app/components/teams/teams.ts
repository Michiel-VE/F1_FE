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
import { TeamService } from '../../services/team/team-service';
import { Team } from '../../interfaces/team';
import { ErrorState } from '../../interfaces/error-state';
import { TeamCard } from './team/team';
import { Header } from '../common/header/header';
import { Error as ErrorComponent } from '../common/error/error';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, TeamCard, Header, ErrorComponent],
  templateUrl: './teams.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Teams implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly yearChanges$ = new Subject<string>();

  readonly teams = signal<Team[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<ErrorState | null>(null);

  readonly selectedYear = signal<string>(new Date().getFullYear().toString());
  year: string = new Date().getFullYear().toString();

  constructor() {
    this.yearChanges$
      .pipe(
        tap((newYear) => {
          this.year = newYear;
          this.selectedYear.set(newYear);
          this.teams.set([]);
          this.isLoading.set(true);
          this.error.set(null);
        }),
        switchMap((newYear) =>
          this.teamService.getData<Team[] | null>(`f1_teams_${newYear}`, newYear).pipe(
            catchError((err: HttpErrorResponse) => {
              if (err.status === 404 || err.status === 204) {
                return of([] as Team[]);
              }
              this.error.set({
                message: this.extractErrorMessage(err, 'Error fetching teams'),
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
          this.teams.set(Array.isArray(data) ? data : []);
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