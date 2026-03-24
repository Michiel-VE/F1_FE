import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  // Using signals for optimized fine-grained reactivity
  readonly currentYear = signal(new Date().getFullYear());
  
  readonly endpoints = signal<Endpoint[]>([
    {
      title: 'All F1 Drivers',
      desc: 'Get a full list of every Formula 1 driver — past and present.',
      btn: 'View All',
      linkTo: '/drivers'
    },
    {
      title: 'Drivers by Season',
      desc: 'Discover which drivers raced in any specific F1 season.',
      btn: 'Select Season'
    },
    {
      title: 'Driver by Number',
      desc: 'Find detailed information about a driver using their permanent number.',
      btn: 'Search Driver'
    },
    {
      title: 'Career History',
      desc: 'Explore a driver’s full career statistics and performance timeline.',
      btn: 'Explore'
    },
  ]);
}