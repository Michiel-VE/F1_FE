import { Component, OnInit, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../../../interfaces/team';
import { PredictionService } from '../../../services/prediction/prediction-service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { DragDropModule, CdkDragDrop, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router } from '@angular/router';
import { PredictionHeader } from '../../common/prediction-header/prediction-header';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [style({ opacity: 0 }), animate('140ms ease-out', style({ opacity: 1 }))]),
  transition(':leave', [animate('100ms ease-in', style({ opacity: 0 }))]),
]);

export const listAnimation = trigger('listAnimation', [
  transition('* <=> *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'scale(0.97)' }),
        stagger(15, [
          animate(
            '160ms cubic-bezier(0.16, 1, 0.3, 1)',
            style({ opacity: 1, transform: 'scale(1)' }),
          ),
        ]),
      ],
      { optional: true },
    ),
    query(
      ':leave',
      [stagger(10, [animate('120ms ease-in', style({ opacity: 0, transform: 'scale(0.97)' }))])],
      { optional: true },
    ),
  ]),
]);

export interface DragPreview {
  label: string;
  rank: string | null;
  x: number;
  y: number;
}

@Component({
  selector: 'app-constructor-prediction',
  standalone: true,
  imports: [CommonModule, DragDropModule, PredictionHeader],
  templateUrl: './constructor-prediction.html',
  styleUrl: './constructor-prediction.css',
  animations: [listAnimation, fadeIn],
})
export class ConstructorPrediction implements OnInit {
  currentPoolId = signal<string | null>(null);
  currentPoolName = signal<string | null>(null);
  hasGroups = signal<boolean>(false);
  activeModal = signal<'none' | 'create' | 'join'>('none');

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private predictionService = inject(PredictionService);
  private moving = false;

  readonly allTeams = signal<Team[]>([]);
  readonly rankedSelection = signal<Team[]>([]);
  readonly animatingIds = signal<Set<string>>(new Set());
  readonly draggingId = signal<string | null>(null);
  readonly dragPreview = signal<DragPreview | null>(null);

  readonly availablePool = computed(() => {
    const rankedIds = new Set(this.rankedSelection().map((t: Team) => t.id));
    return this.allTeams().filter((t: Team) => !rankedIds.has(t.id));
  });

  readonly placeholderCount = computed(() => {
    const totalCount = this.allTeams().length || 10;
    return Array(totalCount).fill(0);
  });

  readonly poolFillers = computed(() => {
    const total = this.allTeams().length || 0;
    const visible = this.availablePool().length;
    const cols = 3;
    const totalSlots = Math.ceil(total / cols) * cols;
    return Array(Math.max(0, totalSlots - visible)).fill(0);
  });

  ngOnInit(): void {
    const pathPoolId = this.route.snapshot.paramMap.get('poolId');
    this.currentPoolId.set(pathPoolId);

    forkJoin({
      teams: this.predictionService.getTeamsForPrediction<Team[]>(),
      pools: this.predictionService.getUserPools(),
      savedPrediction: this.predictionService
        .getSavedPrediction(pathPoolId)
        .pipe(catchError(() => of({ predictedTeams: [] }))),
    }).subscribe({
      next: ({ teams, pools, savedPrediction }) => {
        const verifiedTeams = teams ?? [];
        this.allTeams.set(verifiedTeams);

        if (pools && pools.length > 0) {
          this.hasGroups.set(true);
          if (pathPoolId) {
            const currentPool = pools.find((p: any) => p.id === pathPoolId);
            if (currentPool) {
              this.currentPoolName.set(currentPool.name);
            }
          }
        } else {
          this.hasGroups.set(false);
        }

        // FIX: predictedTeams is string[] (UUIDs), not objects
        if (savedPrediction?.predictedTeams?.length) {
          const loadedSelection: Team[] = savedPrediction.predictedTeams
            .map((id: string) => verifiedTeams.find((t: Team) => t.id === id))
            .filter((t: Team | undefined): t is Team => !!t);
          this.rankedSelection.set(loadedSelection);
        }
      },
      error: (err: any) => console.error('Initialization sequence failed', err),
    });
  }

  @HostListener('mousemove', ['$event'])
  @HostListener('touchmove', ['$event'])
  onPointerMove(event: MouseEvent | TouchEvent) {
    if (!this.dragPreview()) return;
    const x = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const y = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    this.dragPreview.update((p: DragPreview | null) => (p ? { ...p, x, y } : null));
  }

  navigateBack(): void {
    this.router.navigate(['/prediction']);
  }

  addToRanked(team: Team) {
    if (this.rankedSelection().length >= this.allTeams().length) return;
    this.rankedSelection.update((prev: Team[]) => [...prev, team]);
  }

  removeFromRanked(team: Team) {
    this.rankedSelection.update((prev: Team[]) => prev.filter((t: Team) => t.id !== team.id));
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
    this.animatingIds.set(new Set<string>([movingTeam.id, displacedTeam.id]));
    current[index] = displacedTeam;
    current[targetIndex] = movingTeam;
    this.rankedSelection.set(current);
    setTimeout(() => {
      this.animatingIds.set(new Set());
      this.moving = false;
    }, 200);
  }

  onDragStarted(team: Team, rank: string | null, dragEvent: CdkDragStart) {
    const event = dragEvent.event;
    const isMouseEvent = event instanceof MouseEvent;
    const x = isMouseEvent ? event.clientX : (event.touches?.[0]?.clientX ?? 0);
    const y = isMouseEvent ? event.clientY : (event.touches?.[0]?.clientY ?? 0);
    this.draggingId.set(team.id);
    this.dragPreview.set({ label: team.shortName, rank, x, y });
  }

  onDragEnded() {
    this.draggingId.set(null);
    this.dragPreview.set(null);
  }

  isDragging(teamId: string): boolean {
    return this.draggingId() === teamId;
  }

  onDrop(event: CdkDragDrop<Team[]>) {
    if (event.previousContainer === event.container && event.container.id === 'standingList') {
      if (event.previousIndex === event.currentIndex) return;
      this.rankedSelection.update((prev: Team[]) => {
        const updated = [...prev];
        moveItemInArray(updated, event.previousIndex, event.currentIndex);
        return updated;
      });
    } else if (
      event.previousContainer !== event.container &&
      event.container.id === 'standingList'
    ) {
      const teamToInsert = event.item.data as Team;
      if (!teamToInsert) return;
      this.rankedSelection.update((prev: Team[]) => {
        const updated = [...prev];
        updated.splice(event.currentIndex, 0, teamToInsert);
        return updated;
      });
    } else if (event.previousContainer !== event.container && event.container.id === 'poolList') {
      const teamToRemove = event.item.data as Team;
      if (!teamToRemove) return;
      this.removeFromRanked(teamToRemove);
    }
  }

  isAnimating(teamId: string): boolean {
    return this.animatingIds().has(teamId);
  }

  openCreateModal(): void {
    this.activeModal.set('create');
  }
  openJoinModal(): void {
    this.activeModal.set('join');
  }
  closeModal(): void {
    this.activeModal.set('none');
  }

  submitModalAction(value: string): void {
    if (!value || !value.trim()) return;
    const sanitizedValue = value.trim();

    if (this.activeModal() === 'create') {
      this.predictionService.createPool(sanitizedValue).subscribe({
        next: () => {
          this.closeModal();
          this.navigateBack();
        },
        error: (err: any) => alert(err.error?.error || 'Failed to create group.'),
      });
    } else if (this.activeModal() === 'join') {
      this.predictionService.joinPool(sanitizedValue).subscribe({
        next: () => {
          this.closeModal();
          this.navigateBack();
        },
        error: (err: any) => alert(err.error?.error || 'Invalid invite code.'),
      });
    }
  }

  submitPrediction(): void {
    const orderedIds = this.rankedSelection().map((team: Team) => team.id);
    console.log(
      'Submitting order:',
      this.rankedSelection().map((t: Team) => t.name),
    );

    const payload = {
      poolId: this.currentPoolId(),
      predictedTeams: orderedIds,
    };

    this.predictionService.postTeamPrediction(payload).subscribe({
      next: () => {
        const message = payload.poolId
          ? 'Group prediction locked in!'
          : 'Personal prediction locked in!';
        alert(message);
        this.navigateBack();
      },
      error: (err: any) => {
        console.error('Submission rejected', err);
        alert(err.error?.message || 'Failed to submit selection.');
      },
    });
  }
}
