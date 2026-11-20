import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { PredictionService } from '../../services/prediction/prediction-service';

export const personalPredictionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const predictionService = inject(PredictionService);
  const router = inject(Router);

  const poolId = route.paramMap.get('poolId');

  return predictionService.getSavedPrediction(poolId).pipe(
    map((prediction) => {
      if (prediction?.predictedTeams?.length) {
        return poolId
          ? router.createUrlTree(['/prediction/view', poolId])
          : router.createUrlTree(['/prediction/view']);
      }
      return true;
    }),
    catchError(() => of(true)),
  );
};