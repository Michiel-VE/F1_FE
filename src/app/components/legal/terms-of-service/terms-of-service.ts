import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  templateUrl: './terms-of-service.html',
  imports: [CommonModule],
})
export class TermsOfService {
  private router = inject(Router);

  goBack(): void {
    this.router.navigate(['/']);
  }
}