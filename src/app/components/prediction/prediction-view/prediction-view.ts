import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PredictionService } from '../../../services/prediction/prediction-service';
import { AuthService } from '../../../services/auth/auth-service';
import { Router, ActivatedRoute } from '@angular/router';
import { Team } from '../../../interfaces/team';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface ScoredEntry {
  team: Team;
  predictedPosition: number;
  actualPosition: number;
  points: number;
}

interface MemberScore {
  userId: string;
  username: string;
  picture: string;
  totalScore: number;
  scoredTeams: ScoredEntry[];
  expanded: boolean;
}

@Component({
  selector: 'app-prediction-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prediction-view.html',
  styleUrl: './prediction-view.css',
})
export class PredictionView implements OnInit {
  private predictionService = inject(PredictionService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly savedTeams = signal<Team[]>([]);
  readonly allTeams = signal<Team[]>([]);
  readonly poolId = signal<string | null>(null);
  readonly memberScores = signal<MemberScore[]>([]);
  readonly poolCreatorId = signal<string | null>(null);
  readonly showLeaveConfirm = signal<boolean>(false);

  readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? null);
  readonly isCreator = computed(() =>
    !!this.poolCreatorId() && this.poolCreatorId() === this.currentUserId()
  );

  readonly title = computed(() =>
    this.poolId() ? 'Group Constructor Prediction' : 'Your Personal Constructor Prediction',
  );
  readonly subtitle = computed(() =>
    this.poolId()
      ? 'Your locked-in ranking for this group.'
      : 'Your locked-in season ranking strategy.',
  );

  readonly actualStandings = computed(() =>
    [...this.allTeams()].sort((a, b) => b.totalPoints - a.totalPoints)
  );

  readonly scoredTeams = computed(() => this.scoreTeams(this.savedTeams()));

  readonly totalScore = computed(() =>
    this.scoredTeams().reduce((sum, s) => sum + s.points, 0)
  );

  readonly maxScore = computed(() => this.savedTeams().length * 5);

  ngOnInit(): void {
    const poolId = this.route.snapshot.paramMap.get('poolId');
    this.poolId.set(poolId);

    const requests: any = {
      teams: this.predictionService.getTeamsForPrediction<Team[]>(),
      savedPrediction: this.predictionService.getSavedPrediction(poolId),
    };

    if (poolId) {
      requests.poolDetails = this.predictionService.getPoolDetails(poolId).pipe(
        catchError(() => of(null))
      );
    }

    forkJoin(requests).subscribe({
      next: ({ teams, savedPrediction, poolDetails }: any) => {
        const verifiedTeams = teams ?? [];
        this.allTeams.set(verifiedTeams);

        if (savedPrediction?.predictedTeams?.length) {
          const orderedList: Team[] = savedPrediction.predictedTeams
            .map((id: string) => verifiedTeams.find((t: Team) => t.id === id))
            .filter((t: Team | undefined): t is Team => !!t);
          this.savedTeams.set(orderedList);
        }

        if (poolDetails) {
          this.poolCreatorId.set(poolDetails.creatorId ?? null);

          if (poolDetails.leaderBoard) {
            const scores: MemberScore[] = poolDetails.leaderBoard.map((member: any) => {
              const memberTeams: Team[] = (member.predictedTeamIds ?? [])
                .map((id: string) => verifiedTeams.find((t: Team) => t.id === id))
                .filter((t: Team | undefined): t is Team => !!t);

              const scored = this.scoreTeams(memberTeams);
              const total = scored.reduce((sum, s) => sum + s.points, 0);

              return {
                userId: member.userId,
                username: member.username,
                picture: member.picture,
                totalScore: total,
                scoredTeams: scored,
                expanded: false,
              };
            }).sort((a: MemberScore, b: MemberScore) => b.totalScore - a.totalScore);

            this.memberScores.set(scores);
          }
        }
      },
      error: (err: any) => console.error('Failed to load prediction layout', err),
    });
  }

  private scoreTeams(teams: Team[]): ScoredEntry[] {
    const actual = this.actualStandings();
    return teams.map((team, predictedIndex) => {
      const actualIndex = actual.findIndex(t => t.id === team.id);
      const diff = Math.abs(predictedIndex - actualIndex);
      const points = diff === 0 ? 5 : diff === 1 ? 3 : diff === 2 ? 1 : 0;
      return { team, predictedPosition: predictedIndex + 1, actualPosition: actualIndex + 1, points };
    });
  }

  toggleMember(index: number): void {
    this.memberScores.update(scores => scores.map((s, i) =>
      i === index ? { ...s, expanded: !s.expanded } : s
    ));
  }

  leavePool(): void {
    if (this.isCreator()) {
      this.showLeaveConfirm.set(true);
    } else {
      this.doLeave();
    }
  }

  confirmLeave(): void {
    this.showLeaveConfirm.set(false);
    this.doLeave();
  }

  private doLeave(): void {
    const poolId = this.poolId();
    if (!poolId) return;
    this.predictionService.leavePool(poolId).subscribe({
      next: () => this.router.navigate(['/prediction']),
      error: (err: any) => alert(err.error?.error || 'Failed to leave pool.')
    });
  }

  kickMember(userId: string): void {
    const poolId = this.poolId();
    if (!poolId) return;
    this.predictionService.kickMember(poolId, userId).subscribe({
      next: () => {
        this.memberScores.update(scores => scores.filter(s => s.userId !== userId));
      },
      error: (err: any) => alert(err.error?.error || 'Failed to kick member.')
    });
  }

  goBack(): void {
    this.router.navigate(['/prediction']);
  }
}