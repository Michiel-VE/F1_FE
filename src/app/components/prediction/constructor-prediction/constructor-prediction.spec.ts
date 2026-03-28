import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConstructorPrediction } from './constructor-prediction';

describe('ConstructorPrediction', () => {
  let component: ConstructorPrediction;
  let fixture: ComponentFixture<ConstructorPrediction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConstructorPrediction],
    }).compileComponents();

    fixture = TestBed.createComponent(ConstructorPrediction);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
