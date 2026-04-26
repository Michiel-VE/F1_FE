import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverResult } from './driver-result';

describe('DriverResult', () => {
  let component: DriverResult;
  let fixture: ComponentFixture<DriverResult>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverResult],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverResult);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
