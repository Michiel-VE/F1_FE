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
  index = input<number>(0);
  isCurrent = input<boolean>(false);
  isUpcoming = input<boolean>(false);
  isPast = input<boolean>(false);
  isLast = input<boolean>(false);

  readonly startDate = computed(() => new Date(this.race().startDay));
  readonly endDate = computed(() => new Date(this.race().endDay));

  readonly monthShort = computed(() =>
    this.startDate().toLocaleString('en-GB', { month: 'short' }).toUpperCase()
  );

  readonly dayStart = computed(() =>
    this.startDate().getDate().toString().padStart(2, '0')
  );

  readonly dayEnd = computed(() =>
    this.endDate().getDate().toString().padStart(2, '0')
  );

  readonly isMultiDay = computed(() =>
    this.startDate().getDate() !== this.endDate().getDate()
  );

  readonly daysUntil = computed(() => {
    if (!this.isUpcoming()) return null;
    const diff = this.startDate().getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  readonly raceName = computed(() => {
    // Strip the year and "FORMULA 1" prefix for a cleaner display
    return this.race().name
      .replace(/^FORMULA 1\s*/i, '')
      .replace(/\s*\d{4}$/, '')
      .trim();
  });

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