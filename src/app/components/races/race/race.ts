import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Race } from '../../../interfaces/race';
import { RaceStatus } from '../../../enum/race-status';

interface BadgeConfig {
  label: string;
  class: string;
}

@Component({
  selector: 'app-race-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './race.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceCard {
  race = input.required<Race>();
  roundNumber = input<number>(0);
  isCurrent = input<boolean>(false);
  isUpcoming = input<boolean>(false);
  isPast = input<boolean>(false);
  isLast = input<boolean>(false);
  dimPast = input<boolean>(true);

  protected readonly RaceStatus = RaceStatus;

  readonly isRound = computed(() => this.roundNumber() > 0);
  readonly startDate = computed(() => {
    const [year, month, day] = this.race().startDay.split('-').map(Number);
    return new Date(year, month - 1, day);
  });

  readonly endDate = computed(() => {
    const [year, month, day] = this.race().endDay.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(23, 59, 59, 999);
    return date;
  });

  readonly monthShort = computed(() =>
    this.startDate().toLocaleString('en-GB', { month: 'short' }).toUpperCase(),
  );

  readonly dayStart = computed(() => this.startDate().getDate());
  readonly dayEnd = computed(() => this.endDate().getDate());
  readonly isMultiDay = computed(() => this.race().startDay !== this.race().endDay);

  readonly dateRange = computed(() => {
    const start = this.dayStart();
    const end = this.dayEnd();
    const month = this.monthShort();
    return this.isMultiDay() ? `${month} ${start}–${end}` : `${month} ${start}`;
  });

  readonly raceName = computed(() =>
    this.race()
      .name.replace(/^FORMULA 1\s*/i, '')
      .replace(/\s*\d{4}$/, '')
      .trim(),
  );

  // Cancelled/postponed original dates are meaningless — hide them
  readonly showDates = computed(() => {
    const s = this.race().status;
    return s !== RaceStatus.CANCELLED && s !== RaceStatus.POSTPONED;
  });

  // Strike the name only for cancelled races
  readonly strikethrough = computed(() => this.race().status === RaceStatus.CANCELLED);

  // Fallback footer text when no extraInfo and dates are hidden
  readonly statusFallbackText = computed((): string | null => {
    if (this.race().extraInfo) return null;
    switch (this.race().status) {
      case RaceStatus.CANCELLED:
        return 'This event has been cancelled.';
      case RaceStatus.POSTPONED:
        return 'New date to be confirmed.';
      default:
        return null;
    }
  });

  // Show a "Rescheduled date" label above the date for rescheduled events
  readonly showRescheduledLabel = computed(() => this.race().status === RaceStatus.RESCHEDULED);

  private readonly statusMap: Partial<Record<RaceStatus, BadgeConfig>> = {
    [RaceStatus.DELAYED]: {
      label: 'Delayed',
      class: 'text-amber-400 border-amber-600/40 bg-amber-900/20',
    },
    [RaceStatus.POSTPONED]: {
      label: 'Postponed',
      class: 'text-amber-400 border-amber-600/40 bg-amber-900/20',
    },
    [RaceStatus.CANCELLED]: {
      label: 'Cancelled',
      class: 'text-red-400   border-red-600/40   bg-red-900/20',
    },
    [RaceStatus.INTERRUPTED]: {
      label: 'Interrupted',
      class: 'text-amber-400 border-amber-600/40 bg-amber-900/20',
    },
    [RaceStatus.SHORTENED]: {
      label: 'Shortened',
      class: 'text-blue-400  border-blue-600/40  bg-blue-900/20',
    },
    [RaceStatus.PROVISIONAL]: {
      label: 'Provisional',
      class: 'text-purple-400 border-purple-600/40 bg-purple-900/20',
    },
    [RaceStatus.RESCHEDULED]: {
      label: 'Rescheduled',
      class: 'text-blue-400  border-blue-600/40  bg-blue-900/20',
    },
  };

  readonly badge = computed<BadgeConfig | null>(() => {
    if (this.isCurrent()) {
      return { label: 'Happening now', class: 'text-red-400 border-red-600/40 bg-red-900/30' };
    }

    const status = this.race().status;
    if (status && this.statusMap[status]) {
      return this.statusMap[status]!;
    }

    if (this.isUpcoming()) {
      const diff = this.startDate().getTime() - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

      let label = `In ${days} days`;
      if (days <= 0) label = 'Today';
      else if (days === 1) label = 'Tomorrow';

      return { label, class: 'text-gray-300 border-white/10 bg-white/[0.04]' };
    }

    return null;
  });
}
