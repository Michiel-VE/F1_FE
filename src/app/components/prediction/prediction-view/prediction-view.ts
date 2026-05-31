import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PredictionService } from '../../../services/prediction/prediction-service';
import { Router, ActivatedRoute } from '@angular/router';
import { Team } from '../../../interfaces/team';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-prediction-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prediction-view.html',
  styleUrl: './prediction-view.css',
})
export class PredictionView implements OnInit {
  private predictionService = inject(PredictionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly savedTeams = signal<Team[]>([]);
  readonly poolId = signal<string | null>(null);

  readonly title = computed(() =>
    this.poolId() ? 'Group Constructor Prediction' : 'Your Personal Constructor Prediction',
  );
  readonly subtitle = computed(() =>
    this.poolId()
      ? 'Your locked-in ranking for this group.'
      : 'Your locked-in season ranking strategy.',
  );

  ngOnInit(): void {
    const poolId = this.route.snapshot.paramMap.get('poolId');
    console.log('PredictionView poolId:', poolId);
    console.log('Full URL:', this.router.url);
    this.poolId.set(poolId);

    forkJoin({
      teams: this.predictionService.getTeamsForPrediction<Team[]>(),
      savedPrediction: this.predictionService.getSavedPrediction(poolId),
    }).subscribe({
      next: ({ teams, savedPrediction }) => {
        console.log('Raw savedPrediction:', savedPrediction);
        const verifiedTeams = teams ?? [];
        if (savedPrediction?.predictedTeams?.length) {
          const orderedList: Team[] = savedPrediction.predictedTeams
            .map((id: string) => verifiedTeams.find((t: Team) => t.id === id))
            .filter((t: Team | undefined): t is Team => !!t);
          this.savedTeams.set(orderedList);
        }
      },
      error: (err) => console.error('Failed to load prediction layout', err),
    });
  }

  goBack(): void {
    this.router.navigate(['/prediction']);
  }
}
