import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Payment } from './payment';

describe('Payment', () => {
  let component: Payment;
  let fixture: ComponentFixture<Payment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Payment],
      providers: [{ provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Payment);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(component.loading).toBe(true);
    expect(component.success).toBe(false);
    expect(component.errorMessage).toBe('');
  });
});
