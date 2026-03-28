import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';

import { Team } from '../../../interfaces/team';
import { getPodiumGradient } from '../../common/border-accent/border-accent';

@Component({
  selector: 'app-team-card',
  standalone: true,
  imports: [],
  templateUrl: './team.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamCard {
  team = input.required<Team>();
  position = input<number>(0);

  readonly isPodium = computed(() => this.position() <= 3);

   borderAccent(pos: number) {
      return getPodiumGradient(pos);
    }

  badgeClass(): string {
    const position = this.position();
    if (position === 1) return 'bg-yellow-400/10 border-yellow-400/30';
    if (position === 2) return 'bg-slate-400/10 border-slate-400/25';
    if (position === 3) return 'bg-orange-500/10 border-orange-500/25';
    return 'bg-red-600/10 border-red-600/20';
  }

  posNumClass(): string {
    const position = this.position();
    if (position === 1) return 'text-yellow-400';
    if (position === 2) return 'text-slate-300';
    if (position === 3) return 'text-orange-400';
    return 'text-red-500';
  }

  accentTextClass(): string {
    const position = this.position();
    if (position === 1) return 'text-yellow-400';
    if (position === 2) return 'text-slate-300';
    if (position === 3) return 'text-orange-400';
    return 'text-red-500';
  }
}
