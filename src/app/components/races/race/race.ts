import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Race } from '../../../interfaces/race';

@Component({
  selector: 'app-race-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './race.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaceCard {
  race = input.required<Race>();
  roundNumber = input<number>(0);   // 0 = pre-season/testing, not a round
  isCurrent = input<boolean>(false);
  isUpcoming = input<boolean>(false);
  isPast = input<boolean>(false);
  isLast = input<boolean>(false);
  dimPast = input<boolean>(true);   // false for historical year view

  readonly isRound = computed(() => this.roundNumber() > 0);

  readonly startDate = computed(() => new Date(this.race().startDay));
  readonly endDate = computed(() => new Date(this.race().endDay));

  readonly monthShort = computed(() =>
    this.startDate().toLocaleString('en-GB', { month: 'short' }).toUpperCase(),
  );

  readonly dayStart = computed(() => this.startDate().getDate());
  readonly dayEnd = computed(() => this.endDate().getDate());

  readonly isMultiDay = computed(
    () => this.race().startDay !== this.race().endDay,
  );

  readonly dateRange = computed(() => {
    const start = this.dayStart();
    const end = this.dayEnd();
    const month = this.monthShort();
    if (this.isMultiDay()) return `${month} ${start}–${end}`;
    return `${month} ${start}`;
  });

  readonly daysUntil = computed(() => {
    if (!this.isUpcoming()) return null;
    const diff = this.startDate().getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  readonly raceName = computed(() =>
    this.race().name
      .replace(/^FORMULA 1\s*/i, '')
      .replace(/\s*\d{4}$/, '')
      .trim(),
  );

  readonly statusLabel = computed(() => {
    if (this.isCurrent()) return 'Live';
    if (this.isUpcoming()) {
      const d = this.daysUntil();
      if (d === 0) return 'Today';
      if (d === 1) return 'Tomorrow';
      return `In ${d} days`;
    }
    return 'Completed';
  });
}