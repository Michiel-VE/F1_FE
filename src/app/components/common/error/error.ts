import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorState } from '../../../interfaces/error-state';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error.html',
  styleUrl: './error.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Error {
  error = input.required<ErrorState | null>();
  retry = output<void>();

  onRetry(): void {
    this.retry.emit();
  }
}