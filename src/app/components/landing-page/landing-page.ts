import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';


interface Endpoint {
  title: string;
  desc: string;
  btn: string;
  linkTo?: string;
  gradient: string;
}

@Component({
  selector: 'app-landing-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  endpoints: Endpoint[] = [
    {
      title: 'All F1 Drivers',
      desc: 'Get a full list of every Formula 1 driver — past and present.',
      btn: 'View All',
      linkTo: '/drivers',
      gradient: 'from-red-600 to-red-800',
    },
    {
      title: 'Drivers by Season',
      desc: 'Discover which drivers raced in any specific F1 season.',
      btn: 'Select Season',
      gradient: 'from-orange-500 to-red-600',
    },
    {
      title: 'Driver by Number',
      desc: 'Find detailed information about a driver using their permanent number.',
      btn: 'Search Driver',
      gradient: 'from-rose-600 to-pink-600',
    },
    {
      title: 'Career History',
      desc: 'Explore a driver’s full career statistics and performance timeline.',
      btn: 'Explore',
      gradient: 'from-fuchsia-600 to-purple-700',
    },
  ];
}
