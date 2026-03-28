import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RacePrediction } from './race-prediction';

describe('RacePrediction', () => {
  let component: RacePrediction;
  let fixture: ComponentFixture<RacePrediction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RacePrediction],
    }).compileComponents();

    fixture = TestBed.createComponent(RacePrediction);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
