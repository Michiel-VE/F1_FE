import { ChangeDetectionStrategy, Component, inject, input, signal, OnInit, model } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './search.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Search implements OnInit {
  searchedYear = model<string>(new Date().getFullYear().toString());
  seasonCount = input<number>(10);

  years = signal<number[]>([]);
  searchForm!: FormGroup;
  private fb = inject(FormBuilder);

  ngOnInit() {
    this.years.set(this.generateYears());

    this.searchForm = this.fb.group({
      seasonYear: new FormControl(this.searchedYear(), { nonNullable: true }),
    });
  }

  private generateYears(): number[] {
    const currentYear = new Date().getFullYear();
    const count = Math.max(1, this.seasonCount());
    return Array.from({ length: count }, (_, i) => currentYear - i);
  }

  onSubmit() {
    const selectedValue = this.searchForm.get('seasonYear')?.value;
    if (selectedValue && selectedValue !== this.searchedYear()) {
      this.searchedYear.set(selectedValue);
    }
  }
}