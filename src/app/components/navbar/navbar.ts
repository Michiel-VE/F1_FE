import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  ViewEncapsulation,
  HostListener,
  ElementRef,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { CommonModule } from '@angular/common';

interface NavLink {
  name: string;
  path?: string;
  requiresAuth?: boolean;
  hideIfAuth?: boolean;
  children?: { name: string; path: string }[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class Navbar {
  readonly authService = inject(AuthService);
  readonly isMenuOpen = signal(false);
  readonly activeDropdown = signal<string | null>(null);
  readonly profileOpen = signal(false);
  readonly isUserAuth = this.authService.isAuthenticated;
  readonly currentUser = this.authService.currentUser;

  private readonly eRef = inject(ElementRef);
  private readonly router = inject(Router);

  readonly initials = computed(() => {
    const name = this.currentUser()?.name;
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  // Profile link removed — handled by avatar popover
  private readonly allLinks = signal<NavLink[]>([
    { name: 'Drivers', path: '/drivers' },
    { name: 'Teams', path: '/teams' },
    { name: 'Races', path: '/races' },
    { name: 'Login', path: '/login', hideIfAuth: true },
    {
      name: 'Predictions',
      requiresAuth: true,
      children: [
        { name: 'Race Prediction', path: '/prediction/race' },
        { name: 'Constructor Prediction', path: '/prediction/constructor' },
      ],
    },
  ]);

  readonly visibleLinks = computed(() => {
    const isAuth = this.authService.isAuthenticated();
    return this.allLinks().filter((link) => {
      if (link.hideIfAuth && isAuth) return false;
      if (link.requiresAuth && !isAuth) return false;
      return true;
    });
  });

  toggleDropdown(name: string | null): void {
    this.profileOpen.set(false);
    this.activeDropdown.update((current) => (current === name ? null : name));
  }

  toggleProfile(): void {
    this.activeDropdown.set(null);
    this.profileOpen.update((open) => !open);
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:keydown.escape')
  clickout(event?: Event) {
    if (event && this.eRef.nativeElement.contains(event.target)) {
      return;
    }
    this.activeDropdown.set(null);
    this.profileOpen.set(false);
    this.isMenuOpen.set(false);
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  logout(): void {
    this.profileOpen.set(false);
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Logout failed', err);
      },
    });
  }
}
