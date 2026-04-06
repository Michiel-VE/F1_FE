import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { RouterLink } from '@angular/router';

interface Endpoint {
  title: string;
  desc: string;
  btn: string;
  linkTo?: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  readonly currentYear = signal(new Date().getFullYear());

  readonly endpoints = signal<Endpoint[]>([
    {
      title: `Season ${this.currentYear()} F1 Drivers`,
      desc: 'Get a full list of every Formula 1 driver for the current season.',
      btn: `View ${this.currentYear()} Drivers`,
      linkTo: '/drivers',
    },
    {
      title: 'Career History',
      desc: 'Explore a driver’s full career statistics and performance timeline.',
      btn: 'Explore',
    },
  ]);
}
