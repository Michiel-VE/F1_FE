import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../../../interfaces/team';

export interface ScoredEntry {
  team: Team;
  predictedPosition: number;
  actualPosition: number;
  points: number;
}

@Component({
  selector: 'app-scored-prediction-accordion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scored-prediction-accordion.html',
})
export class ScoredPredictionAccordion {
  entries = input.required<ScoredEntry[]>();
  maxScore = input<number>(0);

  // Optional header metadata (used for pool member rows; omitted or simple for personal prediction)
  title = input<string | null>(null);
  rank = input<number | null>(null);
  picture = input<string | null>(null);
  totalScore = input<number | null>(null);
  showHeader = input<boolean>(true);
  canKick = input<boolean>(false);

  // Defaults to false (closed) for pools; pass [defaultOpen]="true" for personal prediction
  defaultOpen = input<boolean>(false);

  kick = output<void>();
  toggled = output<boolean>();

  expanded = signal<boolean>(false);

  constructor() {
    effect(
      () => {
        this.expanded.set(this.defaultOpen());
      },
      { allowSignalWrites: true },
    );
  }

  toggle(): void {
    const next = !this.expanded();
    this.expanded.set(next);
    this.toggled.emit(next);
  }
}