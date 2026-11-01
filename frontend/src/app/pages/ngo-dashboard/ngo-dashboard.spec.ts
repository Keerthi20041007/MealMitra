import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgoDashboard } from './ngo-dashboard';

describe('NgoDashboard', () => {
  let component: NgoDashboard;
  let fixture: ComponentFixture<NgoDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgoDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(NgoDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should provide a button to open the support assistant', () => {
    const supportButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('.help-card');

    expect(supportButton).toBeTruthy();
    expect(supportButton.getAttribute('aria-label')).toBe(
      'Open MealMitra AI support assistant',
    );
  });

  it('should reuse the donor map URL unless the coordinates change', () => {
    const donation = { latitude: 12.34, longitude: 56.78 };

    const initialUrl = component.getDonorMapUrl(donation);

    expect(component.getDonorMapUrl(donation)).toBe(initialUrl);

    donation.latitude = 12.35;

    expect(component.getDonorMapUrl(donation)).not.toBe(initialUrl);
  });
});
