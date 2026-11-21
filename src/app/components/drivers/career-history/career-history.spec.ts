import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CareerHistory } from './career-history';

describe('CareerHistory', () => {
  let component: CareerHistory;
  let fixture: ComponentFixture<CareerHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CareerHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(CareerHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
