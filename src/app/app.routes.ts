import { Routes } from '@angular/router';
import { authGuard } from './guards/auth/auth-guard';

export const routes: Routes = [
  {
    path: 'drivers',
    loadComponent: () => import('./components/drivers/drivers').then((m) => m.Drivers),
  },
  { path: 'teams', loadComponent: () => import('./components/teams/teams').then((m) => m.Teams) },
  { path: 'races', loadComponent: () => import('./components/races/races').then((m) => m.Races) },
  {
    path: 'prediction',
    canActivate: [authGuard],
    children: [
      {
        path: 'race',
        loadComponent: () =>
          import('./components/prediction/race-prediction/race-prediction').then(
            (m) => m.RacePrediction,
          ),
      },
      {
        path: 'constructor',
        loadComponent: () =>
          import('./components/prediction/constructor-prediction/constructor-prediction').then(
            (m) => m.ConstructorPrediction,
          ),
      },
    ],
  },
  //   { path: 'profile', loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () =>
      import('./components/landing-page/landing-page').then((m) => m.LandingPage),
  },
];
