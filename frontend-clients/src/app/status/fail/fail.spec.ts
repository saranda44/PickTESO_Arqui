import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fail } from './fail';

describe('Fail', () => {
  let component: Fail;
  let fixture: ComponentFixture<Fail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fail],
    }).compileComponents();

    fixture = TestBed.createComponent(Fail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
