import { Component, inject, signal } from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { AuthService } from './services/auth/auth-service';
import { Toast } from './components/common/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Toast],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('f1_app');

  private authService = inject(AuthService);

  constructor() {
    this.authService.checkAuth().subscribe();
  }
}
