import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoolDashboard } from './pool-dashboard';

describe('PoolDashboard', () => {
  let component: PoolDashboard;
  let fixture: ComponentFixture<PoolDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoolDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(PoolDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
