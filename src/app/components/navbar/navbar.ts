import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavLink {
  name: string;
  path: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  // Using signals for fine-grained reactivity
  readonly isMenuOpen = signal(false);

  readonly links = signal<NavLink[]>([
    { name: 'Drivers', path: '/drivers' },
    { name: 'Teams', path: '/teams' },
    { name: 'Races', path: '/races' },
    { name: 'Predictions', path: '/prediction' },
    { name: 'Profile', path: '/profile' },
    { name: 'Auth', path: '/auth' },
  ]);

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }
}