import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  readonly email = signal('');
  readonly password = signal('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.route.snapshot.queryParamMap.get('token');

      if (token) {
        this.authService.setToken(token);

        // Get the return URL from query params, default to drivers
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/drivers';

        this.router.navigateByUrl(returnUrl, {
          replaceUrl: true,
        });
      }
    }
  }

  loginWithGoogle(): void {
    // We append the current returnUrl to the Google Auth URL so the backend
    // can potentially pass it back, or it stays in the browser state.
    window.location.href = environment.googleAuthURL;
  }

  onSubmit(): void {
    if (!this.email() || !this.password()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    setTimeout(() => {
      this.authService.setToken('mock-jwt-token');

      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/drivers';

      this.router.navigateByUrl(returnUrl);
      this.isLoading.set(false);
    }, 1500);
  }
}
