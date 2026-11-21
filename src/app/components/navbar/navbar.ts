import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  ViewEncapsulation,
  HostListener,
  ElementRef,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth/auth-service';
import { CommonModule } from '@angular/common';

interface NavLink {
  name: string;
  path?: string;
  exact?: boolean;
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
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.closeAllMenus();
      });
  }

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

  private readonly allLinks = signal<NavLink[]>([
    { name: 'Drivers', path: '/drivers', exact: true },
    { name: 'Teams', path: '/teams' },
    { name: 'Races', path: '/races' },
    { name: 'Driver Careers', path: '/drivers/career-history' },
    { name: 'Login', path: '/login', hideIfAuth: true },
    { name: 'Predictions', path: '/prediction', requiresAuth: true },
  ]);

  readonly visibleLinks = computed(() => {
    const isAuth = this.authService.isAuthenticated();
    return this.allLinks().filter((link) => {
      if (link.hideIfAuth && isAuth) return false;
      if (link.requiresAuth && !isAuth) return false;
      return true;
    });
  });

  private closeAllMenus(): void {
    this.activeDropdown.set(null);
    this.profileOpen.set(false);
    this.isMenuOpen.set(false);
  }

  toggleDropdown(name: string | null): void {
    this.profileOpen.set(false);
    this.activeDropdown.update((current) => (current === name ? null : name));
  }

  toggleProfile(): void {
    this.activeDropdown.set(null);
    this.profileOpen.update((open) => !open);
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (this.eRef.nativeElement.contains(event.target)) {
      return;
    }
    this.closeAllMenus();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeAllMenus();
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  logout(): void {
    this.closeAllMenus();
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {},
    });
  }
}
