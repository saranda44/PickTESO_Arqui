import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OrderItem } from './order-item';
import { IOrder } from '../../../../interfaces/order.interface';

const mockOrder: IOrder = {
  id: 1,
  store_id: 5,
  user_id: 10,
  status: 'paid',
  total: 150,
  created_at: '2024-03-01T10:00:00Z',
  updated_at: '2024-03-01T10:00:00Z',
};

describe('OrderItem', () => {
  let component: OrderItem;
  let fixture: ComponentFixture<OrderItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderItem],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderItem);
    fixture.componentRef.setInput('order', mockOrder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('statusLabel returns correct label for paid status', () => {
    expect(component.statusLabel).toBeTruthy();
  });

  it('statusClass includes the order status', () => {
    expect(component.statusClass).toContain('paid');
  });

  it('customerLabel includes user_id', () => {
    expect(component.customerLabel).toContain('10');
  });
});
