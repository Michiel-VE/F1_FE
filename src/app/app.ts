import { Component, inject, signal } from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { AuthService } from './services/auth/auth-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('f1_app');

  private authService = inject(AuthService);

  constructor() {
    this.authService.checkAuth().subscribe();
  }
}
