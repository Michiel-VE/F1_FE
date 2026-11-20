import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  templateUrl: './privacy-policy.html',
  imports: [CommonModule],
})
export class PrivacyPolicy {
  private router = inject(Router);

  goBack(): void {
    this.router.navigate(['/']);
  }
}