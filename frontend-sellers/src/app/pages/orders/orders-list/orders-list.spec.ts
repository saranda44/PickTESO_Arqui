import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrdersList } from './orders-list';
import { OrdersService } from '../../../services/orders';
import { AuthService } from '../../../services/auth';
import { AlertService } from '../../../services/alert';
import { of, throwError } from 'rxjs';

const mockOrdersService = {
  getOrdersByStore: vi.fn(() => of({ orders: [
    { id: 1, status: 'pending', created_at: '2026-05-05T10:00:00Z' },
    { id: 2, status: 'paid', created_at: '2026-05-04T10:00:00Z' }
  ]})),
};

const mockAuthService = {
  getStoreId: vi.fn(() => '5'),
};

const mockAlertService = {
  showError: vi.fn(),
  showSuccess: vi.fn(),
};

describe('OrdersList', () => {
  let component: OrdersList;
  let fixture: ComponentFixture<OrdersList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersList],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AlertService, useValue: mockAlertService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersList);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit loads orders', () => {
    component.ngOnInit();
    expect(mockOrdersService.getOrdersByStore).toHaveBeenCalledWith(5);
    expect(component.orders().length).toBe(2);
  });

  it('ngOnInit shows error if no storeId', () => {
    mockAuthService.getStoreId.mockReturnValueOnce('');
    component.ngOnInit();
    expect(mockAlertService.showError).toHaveBeenCalledWith('No se encontró la tienda asignada');
  });

  it('ngOnInit handles load error', () => {
    mockOrdersService.getOrdersByStore.mockReturnValueOnce(throwError(() => new Error('Error')));
    component.ngOnInit();
    expect(mockAlertService.showError).toHaveBeenCalledWith('Error al cargar los pedidos');
    expect(component.loading()).toBe(false);
  });

  it('toggleStatusFilter adds status to filter', () => {
    component.toggleStatusFilter('pending');
    expect(component.isStatusSelected('pending')).toBe(true);
  });

  it('toggleStatusFilter removes status from filter', () => {
    component.toggleStatusFilter('pending');
    component.toggleStatusFilter('pending');
    expect(component.isStatusSelected('pending')).toBe(false);
  });

  it('clearFilters removes all status filters', () => {
    component.toggleStatusFilter('pending');
    component.toggleStatusFilter('paid');
    component.clearFilters();
    expect(component.selectedStatuses().size).toBe(0);
  });

  it('filteredAndSortedOrders filters by selected statuses', () => {
    component.orders.set([
      { id: 1, status: 'pending', created_at: '2026-05-05T10:00:00Z' },
      { id: 2, status: 'paid', created_at: '2026-05-04T10:00:00Z' }
    ] as any);
    component.toggleStatusFilter('pending');
    const filtered = component.filteredAndSortedOrders();
    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('pending');
  });

  it('filteredAndSortedOrders sorts by created_at descending', () => {
    component.orders.set([
      { id: 1, status: 'pending', created_at: '2026-05-05T10:00:00Z' },
      { id: 2, status: 'pending', created_at: '2026-05-06T10:00:00Z' }
    ] as any);
    const sorted = component.filteredAndSortedOrders();
    expect(sorted[0].id).toBe(2);
    expect(sorted[1].id).toBe(1);
  });
});
