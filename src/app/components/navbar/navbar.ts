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
  path?: string; // Path is optional if it's just a dropdown trigger
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
  readonly isUserAuth = this.authService.isAuthenticated;

  private readonly eRef = inject(ElementRef);
  private readonly router = inject(Router);

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
    { name: 'Profile', path: '/profile', requiresAuth: true },
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
    this.activeDropdown.update((current) => (current === name ? null : name));
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:keydown.escape')
  clickout(event?: Event) {
    if (event && this.eRef.nativeElement.contains(event.target)) {
      return;
    }

    this.activeDropdown.set(null);
    this.isMenuOpen.set(false);
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  logout(): void {
    this.authService.logout();
    this.isMenuOpen.set(false);
    this.activeDropdown.set(null);

    this.router.navigate(['/']);
  }
}
