import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';

import { Team } from '../../../interfaces/team';

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

  // How long the team has existed
  readonly yearsActive = computed(() => {
    const created = new Date(this.team().created_at);
    return new Date().getFullYear() - created.getFullYear();
  });

  readonly lastUpdated = computed(() => {
    const date = this.team().updated_at ?? this.team().created_at;
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  });

  // Podium colour helpers — full class strings so Tailwind doesn't purge them
  borderClass(): string {
    const p = this.position();
    if (p === 1) return 'border-yellow-500/40 hover:border-yellow-400/70';
    if (p === 2) return 'border-slate-400/30 hover:border-slate-300/50';
    if (p === 3) return 'border-orange-700/30 hover:border-orange-500/50';
    return 'border-white/[0.07] hover:border-white/[0.14]';
  }

  stripeClass(): string {
    const p = this.position();
    if (p === 1) return 'bg-yellow-400';
    if (p === 2) return 'bg-slate-400';
    if (p === 3) return 'bg-orange-500';
    return 'bg-red-600';
  }

  badgeClass(): string {
    const p = this.position();
    if (p === 1) return 'bg-yellow-400/10 border-yellow-400/30';
    if (p === 2) return 'bg-slate-400/10 border-slate-400/25';
    if (p === 3) return 'bg-orange-500/10 border-orange-500/25';
    return 'bg-red-600/10 border-red-600/20';
  }

  posNumClass(): string {
    const p = this.position();
    if (p === 1) return 'text-yellow-400';
    if (p === 2) return 'text-slate-300';
    if (p === 3) return 'text-orange-400';
    return 'text-red-500';
  }

  accentTextClass(): string {
    const p = this.position();
    if (p === 1) return 'text-yellow-400';
    if (p === 2) return 'text-slate-300';
    if (p === 3) return 'text-orange-400';
    return 'text-red-500';
  }
}
