import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDonation } from './create-donation';

describe('CreateDonation', () => {
  let component: CreateDonation;
  let fixture: ComponentFixture<CreateDonation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateDonation],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateDonation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
