import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../../../interfaces/team';
import { PredictionService } from '../../../services/prediction/prediction-service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        stagger(35, [
          animate(
            '200ms cubic-bezier(0.25, 1, 0.5, 1)',
            style({ opacity: 1, transform: 'translateX(0)' }),
          ),
        ]),
      ],
      { optional: true },
    ),
    query(
      ':leave',
      [
        stagger(25, [
          animate(
            '160ms cubic-bezier(0.5, 0, 0.75, 0)',
            style({
              opacity: 0,
              transform: 'translateX(-16px)',
              height: '0',
              marginBottom: '0',
              padding: '0',
            }),
          ),
        ]),
      ],
      { optional: true },
    ),
  ]),
]);

export const rankListAnimation = trigger('rankListAnimation', [
  transition('* <=> *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateX(24px)', height: '0', marginBottom: '0' }),
        stagger(30, [
          animate(
            '220ms cubic-bezier(0.25, 1, 0.5, 1)',
            style({ opacity: 1, transform: 'translateX(0)', height: '*', marginBottom: '*' }),
          ),
        ]),
      ],
      { optional: true },
    ),
    query(
      ':leave',
      [
        animate(
          '180ms cubic-bezier(0.5, 0, 0.75, 0)',
          style({
            opacity: 0,
            transform: 'translateX(24px)',
            height: '0',
            marginBottom: '0',
            padding: '0',
          }),
        ),
      ],
      { optional: true },
    ),
  ]),
]);

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.96)' }),
    animate('180ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
  ]),
  transition(':leave', [animate('140ms ease-in', style({ opacity: 0, transform: 'scale(0.96)' }))]),
]);

@Component({
  selector: 'app-constructor-prediction',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './constructor-prediction.html',
  styleUrl: './constructor-prediction.css',
  animations: [listAnimation, rankListAnimation, fadeIn],
})
export class ConstructorPrediction {
  private predictionService = inject(PredictionService);
  private moving = false;

  readonly allTeams = signal<Team[]>([]);
  readonly rankedSelection = signal<Team[]>([]);

  // Tracks which team ids are currently mid-swap and in which direction
  readonly animatingIds = signal<Map<string, 'up' | 'down'>>(new Map());

  readonly availablePool = computed(() => {
    const rankedIds = new Set(this.rankedSelection().map((t) => t.id));
    return this.allTeams().filter((t) => !rankedIds.has(t.id));
  });

  constructor() {
    this.predictionService.getTeamsForPrediction<Team[]>().subscribe((data) => {
      this.allTeams.set(data);
    });
  }

  addToRanked(team: Team) {
    this.rankedSelection.update((prev) => [...prev, team]);
  }

  removeFromRanked(team: Team) {
    this.rankedSelection.update((prev) => prev.filter((t) => t.id !== team.id));
  }

  moveRank(index: number, direction: 'up' | 'down') {
    if (this.moving) return;
    this.moving = true;

    const current = [...this.rankedSelection()];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= current.length) {
      this.moving = false;
      return;
    }

    const movingTeam = current[index];
    const displacedTeam = current[targetIndex];

    // Mark both items with their animation direction BEFORE the swap
    const ids = new Map<string, 'up' | 'down'>();
    ids.set(movingTeam.id, direction);
    ids.set(displacedTeam.id, direction === 'up' ? 'down' : 'up');
    this.animatingIds.set(ids);

    // Small delay so the CSS class is applied before the DOM reorder
    setTimeout(() => {
      [current[index], current[targetIndex]] = [current[targetIndex], current[index]];
      this.rankedSelection.set(current);

      // Clear animation classes after transition completes
      setTimeout(() => {
        this.animatingIds.set(new Map());
        this.moving = false;
      }, 260);
    }, 16);
  }

  getSwapClass(teamId: string): string {
    const dir = this.animatingIds().get(teamId);
    if (dir === 'up') return 'swap-up';
    if (dir === 'down') return 'swap-down';
    return '';
  }

  submitPrediction() {
    const payload = this.rankedSelection().map((team, index) => ({
      teamId: team.id,
      position: index + 1,
    }));

    this.predictionService.postTeamPrediction(payload).subscribe(() => {
      alert('Prediction Saved!');
    });
  }
}
