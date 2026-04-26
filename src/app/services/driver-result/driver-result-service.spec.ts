import { TestBed } from '@angular/core/testing';

import { DriverResultService } from './driver-result-service';

describe('DriverResultService', () => {
  let service: DriverResultService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DriverResultService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
