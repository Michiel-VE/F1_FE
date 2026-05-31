import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PredictionService } from '../../services/prediction/prediction-service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const poolPredictionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const predictionService = inject(PredictionService);
  const router = inject(Router);
  const poolId = route.paramMap.get('poolId');

  if (!poolId) {
    return router.createUrlTree(['/prediction']);
  }

  return predictionService.getSavedPrediction(poolId).pipe(
    map((prediction) => {
      if (prediction?.predictedTeams?.length) {
        return router.createUrlTree(['/prediction/view', poolId]);
      }
      return true;
    }),
    catchError(() => {
      return of(true);
    })
  );
};