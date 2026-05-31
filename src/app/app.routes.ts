import { Routes } from '@angular/router';
import { authGuard } from './guards/auth/auth-guard';
import { personalPredictionGuard } from './guards/prediction-status/prediction-status-guard';
import { poolPredictionGuard } from './guards/prediction-status/pool-prediction-guard';

export const routes: Routes = [
  {
    path: 'drivers',
    loadComponent: () => import('./components/drivers/drivers').then((m) => m.Drivers),
  },
  {
    path: 'teams',
    loadComponent: () => import('./components/teams/teams').then((m) => m.Teams),
  },
  {
    path: 'races',
    loadComponent: () => import('./components/races/races').then((m) => m.Races),
  },
  {
    path: 'prediction',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/prediction/pool-dashboard/pool-dashboard').then(
            (m) => m.PoolDashboard,
          ),
      },
      {
        path: 'editor',
        loadComponent: () =>
          import('./components/prediction/constructor-prediction/constructor-prediction').then(
            (m) => m.ConstructorPrediction,
          ),
        canActivate: [personalPredictionGuard],
      },
      {
        path: 'editor/:poolId',
        loadComponent: () =>
          import('./components/prediction/constructor-prediction/constructor-prediction').then(
            (m) => m.ConstructorPrediction,
          ),
        canActivate: [poolPredictionGuard],
      },
      {
        path: 'view',
        loadComponent: () =>
          import('./components/prediction/prediction-view/prediction-view').then(
            (m) => m.PredictionView,
          ),
      },
      {
        path: 'view/:poolId',
        loadComponent: () =>
          import('./components/prediction/prediction-view/prediction-view').then(
            (m) => m.PredictionView,
          ),
      },
    ],
  },
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