import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionView } from './prediction-view';

describe('PredictionView', () => {
  let component: PredictionView;
  let fixture: ComponentFixture<PredictionView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionView],
    }).compileComponents();

    fixture = TestBed.createComponent(PredictionView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
