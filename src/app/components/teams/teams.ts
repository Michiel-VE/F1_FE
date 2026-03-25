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
import { TeamService } from '../../services/team/team-service';
import { Team } from '../../interfaces/team';
import { ErrorState } from '../../interfaces/error-state';
import { finalize } from 'rxjs/operators';
import { TeamCard } from './team/team';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, TeamCard, Headers],
  templateUrl: './teams.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Teams implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly CACHE_KEY = 'f1_teams_2026';
  private readonly YEAR = '2026';

  readonly teams = signal<Team[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<ErrorState | null>(null);

  readonly selectedYear = signal<string>(new Date().getFullYear().toString());
  year: string = new Date().getFullYear().toString();

  ngOnInit(): void {
    this.fetchTeams();
  }

  onYearChange(newYear: string): void {
    this.selectedYear.set(newYear);
    this.fetchTeams();
  }

  retryFetch(): void {
    this.fetchTeams();
  }

 private fetchTeams(): void {
  this.isLoading.set(true);
  this.error.set(null);

  const year = this.selectedYear();
  const cacheKey = `f1_teams_${year}`;

  this.teamService
    .getData<Team[]>(cacheKey, year)
    .pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoading.set(false)),
    )
    .subscribe({
      next: (data) => this.teams.set(data || []),
      error: (err) => {
        this.error.set({
          message: this.extractErrorMessage(err),
          timestamp: new Date(),
          canRetry: true,
        });
        console.error('[Teams] Error fetching teams:', err);
      },
    });
}

  private extractErrorMessage(err: Error): string {
    if (typeof err === 'string') return err;
    if (err?.message) return err.message;
    return 'Failed to fetch teams. Please try again.';
  }
}
