import { TestBed } from '@angular/core/testing';

import { MemoryCache } from './memory-cache';

describe('MemoryCache', () => {
  let service: MemoryCache;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MemoryCache);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
