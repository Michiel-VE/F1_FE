import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoredPredictionAccordion } from './scored-prediction-accordion';

describe('ScoredPredictionAccordion', () => {
  let component: ScoredPredictionAccordion;
  let fixture: ComponentFixture<ScoredPredictionAccordion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoredPredictionAccordion],
    }).compileComponents();

    fixture = TestBed.createComponent(ScoredPredictionAccordion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
