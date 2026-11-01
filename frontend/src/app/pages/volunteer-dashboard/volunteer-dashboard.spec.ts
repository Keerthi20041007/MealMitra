import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolunteerDashboard } from './volunteer-dashboard';

describe('VolunteerDashboard', () => {
  let component: VolunteerDashboard;
  let fixture: ComponentFixture<VolunteerDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
