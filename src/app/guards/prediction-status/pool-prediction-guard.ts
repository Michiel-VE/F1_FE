import { CanActivateFn } from '@angular/router';

export const poolPredictionGuard: CanActivateFn = (route, state) => {
  return true;
};
