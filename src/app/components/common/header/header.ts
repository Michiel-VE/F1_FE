import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  model,
} from '@angular/core';
import { Search } from '../search/search';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [Search],
  templateUrl: './header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  title = input.required<string>();
  selectedYear = input<string>(new Date().getFullYear().toString());
  searchedYear = model<string>(new Date().getFullYear().toString());

  searchedYearChange = output<string>();

  onYearChange(year: string): void {
    this.searchedYearChange.emit(year);
  }
}