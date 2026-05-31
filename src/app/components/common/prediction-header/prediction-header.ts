import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-prediction-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prediction-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PredictionHeader {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) subtitle!: string;
  @Input() badgeText: string | null = null;
  @Input() badgeClass: string = 'bg-blue-600/10 text-blue-400 border-blue-600/20';
  @Input() showActionButtons: boolean = false;
  @Input() showDashboardButton: boolean = true;

  @Output() joinGroup = new EventEmitter<void>();
  @Output() createGroup = new EventEmitter<void>();
  @Output() navigateBack = new EventEmitter<void>();
}