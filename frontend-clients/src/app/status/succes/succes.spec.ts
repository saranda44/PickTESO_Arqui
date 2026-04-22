import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Succes } from './succes';

describe('Succes', () => {
  let component: Succes;
  let fixture: ComponentFixture<Succes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Succes],
    }).compileComponents();

    fixture = TestBed.createComponent(Succes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
