import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PredictionHeader } from '../../common/prediction-header/prediction-header';
import { WorkspaceItem } from '../../../interfaces/pool';
import { PredictionService } from '../../../services/prediction/prediction-service';
import { AuthService } from '../../../services/auth/auth-service';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-pool-dashboard',
  standalone: true,
  imports: [CommonModule, PredictionHeader],
  templateUrl: './pool-dashboard.html',
})
export class PoolDashboard implements OnInit {
  private predictionService = inject(PredictionService);
  private authService = inject(AuthService);
  private router = inject(Router);

  workspaces = signal<WorkspaceItem[]>([]);
  isLoading = signal<boolean>(true);
  activeModal = signal<'none' | 'create' | 'join'>('none');
  currentUserId = signal<string | null>(null);
  copiedCode = signal<string | null>(null);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.currentUserId.set(user?.id ?? null);
    this.checkNavigationAndLoad();
  }

  checkNavigationAndLoad(): void {
    this.isLoading.set(true);

    this.predictionService.getPredictionStatus().subscribe({
      next: (status) => {
        if (!status.hasPools && !status.hasPersonalPrediction) {
          this.router.navigate(['/prediction/editor']);
          return;
        }
        this.loadWorkspaces();
      },
      error: (err: any) => {
        console.error('Failed verification checkpoint lookup', err);
        this.loadWorkspaces();
      }
    });
  }

  loadWorkspaces(): void {
    this.predictionService.getUserPools().subscribe({
      next: (groups: any[]) => {
        const list: WorkspaceItem[] = [];

        list.push({ id: null, name: 'My Personal Prediction', type: 'personal' });

        if (groups?.length > 0) {
          groups.forEach((pool: any) => {
            list.push({
              id: pool.id,
              name: pool.name,
              type: 'group',
              memberCount: pool.memberCount,
              inviteCode: pool.inviteCode,
              creatorId: pool.creatorId,
            });
          });
        }

        this.workspaces.set(list);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Failed fetching workspace aggregates', err);
        this.isLoading.set(false);
      }
    });
  }

  navigateToWorkspace(item: WorkspaceItem): void {
    if (item.id === null) {
      this.predictionService.getPredictionStatus().pipe(
        switchMap((status) => {
          if (status.hasPersonalPrediction) {
            this.router.navigate(['/prediction/view']);
          } else {
            this.router.navigate(['/prediction/editor']);
          }
          return of(null);
        })
      ).subscribe();
    } else {
      this.predictionService.getSavedPrediction(item.id).subscribe({
        next: (prediction) => {
          if (prediction?.predictedTeams?.length) {
            this.router.navigate(['/prediction/view', item.id]);
          } else {
            this.router.navigate(['/prediction/editor', item.id]);
          }
        },
        error: () => this.router.navigate(['/prediction/editor', item.id])
      });
    }
  }

  isCreator(item: WorkspaceItem): boolean {
    return !!item.creatorId && item.creatorId === this.currentUserId();
  }

  copyInviteCode(event: Event, code: string): void {
    event.stopPropagation();
    navigator.clipboard.writeText(code).then(() => {
      this.copiedCode.set(code);
      setTimeout(() => this.copiedCode.set(null), 2000);
    });
  }

  openCreateModal(): void { this.activeModal.set('create'); }
  openJoinModal(): void { this.activeModal.set('join'); }
  closeModal(): void { this.activeModal.set('none'); }

  submitModalAction(value: string): void {
    if (!value?.trim()) return;
    const sanitizedValue = value.trim();

    if (this.activeModal() === 'create') {
      this.predictionService.createPool(sanitizedValue).subscribe({
        next: () => { this.closeModal(); this.checkNavigationAndLoad(); },
        error: (err: any) => alert(err.error?.error || 'Failed to create group.')
      });
    } else if (this.activeModal() === 'join') {
      this.predictionService.joinPool(sanitizedValue).subscribe({
        next: () => { this.closeModal(); this.checkNavigationAndLoad(); },
        error: (err: any) => alert(err.error?.error || 'Invalid invite code.')
      });
    }
  }
}