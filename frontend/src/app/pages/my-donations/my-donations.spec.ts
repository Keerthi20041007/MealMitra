import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyDonations } from './my-donations';

describe('MyDonations', () => {
  let component: MyDonations;
  let fixture: ComponentFixture<MyDonations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyDonations],
    }).compileComponents();

    fixture = TestBed.createComponent(MyDonations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
