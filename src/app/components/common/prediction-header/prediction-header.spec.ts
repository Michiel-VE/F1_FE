import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionHeader } from './prediction-header';

describe('PredictionHeader', () => {
  let component: PredictionHeader;
  let fixture: ComponentFixture<PredictionHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(PredictionHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
