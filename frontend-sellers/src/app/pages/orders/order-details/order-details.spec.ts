import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { OrderDetails } from './order-details';
import { OrdersService } from '../../../services/orders';
import { AuthService } from '../../../services/auth';
import { AlertService } from '../../../services/alert';

const mockOrder = {
  id: 42,
  store_id: 5,
  user_id: 1,
  status: 'paid' as const,
  total: 100,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  customer: { id: 1, first_name: 'Juan', paternal_last_name: 'Pérez', maternal_last_name: '', email: '' },
  store: { id: 5, name: 'Test Store', email: '' },
  items: [],
};

const mockOrdersService = {
  getOrderById: vi.fn().mockReturnValue(of({ order: mockOrder })),
  updateStatus: vi.fn().mockReturnValue(of({ order: mockOrder })),
  cancelOrder: vi.fn().mockReturnValue(of({ order: mockOrder })),
  completeOrder: vi.fn().mockReturnValue(of({ data: mockOrder })),
};

const mockAuthService = {
  isLoggedIn: signal(true),
  getStoreId: () => '5',
  getUserId: () => '1',
  getUserRole: () => 'seller',
};

const mockAlertService = {
  showError: vi.fn(),
  showSuccess: vi.fn(),
  showInfo: vi.fn(),
};

const fakeRoute = {
  snapshot: { paramMap: { get: (k: string) => (k === 'id' ? '42' : null) } },
};

describe('OrderDetails', () => {
  let component: OrderDetails;
  let fixture: ComponentFixture<OrderDetails>;

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [OrderDetails],
      providers: [
        provideRouter([]),
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AlertService, useValue: mockAlertService },
        { provide: ActivatedRoute, useValue: fakeRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetails);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads order on ngOnInit using route param id', () => {
    fixture.detectChanges();
    expect(mockOrdersService.getOrderById).toHaveBeenCalledWith(5, 42);
    expect(component.order()?.id).toBe(42);
  });

  it('canPrepare is true only when status is paid', () => {
    fixture.detectChanges();
    expect(component.canPrepare()).toBe(true);
    component.order.set({ ...mockOrder, status: 'preparing' });
    expect(component.canPrepare()).toBe(false);
  });

  it('canCancel is true only when status is paid', () => {
    fixture.detectChanges();
    expect(component.canCancel()).toBe(true);
    component.order.set({ ...mockOrder, status: 'completed' });
    expect(component.canCancel()).toBe(false);
  });

  it('goBack() navigates to /orders', () => {
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.goBack();
    expect(spy).toHaveBeenCalledWith(['/orders']);
  });

  it('submitOtp() shows error when OTP is not 6 digits', () => {
    fixture.detectChanges();
    component.otp.set('12345');
    component.submitOtp();
    expect(mockAlertService.showError).toHaveBeenCalled();
    expect(mockOrdersService.completeOrder).not.toHaveBeenCalled();
  });

  it('submitOtp() calls completeOrder with valid 6-digit OTP', () => {
    fixture.detectChanges();
    component.otp.set('123456');
    component.submitOtp();
    expect(mockOrdersService.completeOrder).toHaveBeenCalledWith(5, 42, '123456');
  });
});
