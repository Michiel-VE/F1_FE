import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'drivers', loadComponent: () => import('./components/drivers/drivers').then(m => m.Drivers) },
//   { path: 'teams', loadComponent: () => import('./cteams/teams.component').then(m => m.TeamsComponent) },
//   { path: 'races', loadComponent: () => import('./races/races.component').then(m => m.RacesComponent) },
//   { path: 'prediction', loadComponent: () => import('./prediction/prediction.component').then(m => m.PredictionComponent) },
//   { path: 'profile', loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) },
//   { path: 'auth', loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent) },
  { path: '', loadComponent: () => import('./components/landing-page/landing-page').then(m => m.LandingPage) }
];
