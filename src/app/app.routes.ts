import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'drivers', loadComponent: () => import('./components/drivers/drivers').then(m => m.Drivers) },
  { path: 'teams', loadComponent: () => import('./components/teams/teams').then(m => m.Teams) },
  { path: 'races', loadComponent: () => import('./components/races/races').then(m => m.Races) },
//   { path: 'prediction', loadComponent: () => import('./prediction/prediction.component').then(m => m.PredictionComponent) },
//   { path: 'profile', loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) },
//   { path: 'auth', loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent) },
  { path: '', loadComponent: () => import('./components/landing-page/landing-page').then(m => m.LandingPage) }
];
