import { ChangeDetectionStrategy, Component, inject, signal, OnInit, model } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './search.html',
  styleUrl: './search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Search implements OnInit {
  searchedYear = model<string>(new Date().getFullYear().toString());
  years = signal<number[]>([]);
  searchForm!: FormGroup;
  private fb = inject(FormBuilder);

  ngOnInit() {
    const currentYear = new Date().getFullYear();
    const yearList: number[] = [];
    for (let year = currentYear; year >= currentYear - 5; year--) {
      yearList.push(year);
    }
    this.years.set(yearList);

    this.searchForm = this.fb.group({
      seasonYear: new FormControl(this.searchedYear(), { nonNullable: true }),
    });
  }

  onSubmit() {
    const selectedValue = this.searchForm.get('seasonYear')?.value;
    this.searchedYear.set(selectedValue);
  }
}
