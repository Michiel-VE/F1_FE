import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { predictionStatusGuard } from './prediction-status-guard';

describe('predictionStatusGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => predictionStatusGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
