import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OrdersService } from './orders';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

const mockAuthService = {
  getUserId: () => 'u1',
  getUserRole: () => 'seller',
  getToken: () => 'tok',
  getStoreId: () => '5',
  isLoggedIn: () => true,
};

describe('OrdersService', () => {
  let service: OrdersService;
  let httpMock: HttpTestingController;
  const base = environment.ordersApiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        OrdersService,
      ],
    });
    service = TestBed.inject(OrdersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getOrdersByStore() GETs /stores/{storeId}/orders', () => {
    service.getOrdersByStore(10).subscribe();
    const req = httpMock.expectOne(`${base}/stores/10/orders`);
    expect(req.request.method).toBe('GET');
    req.flush({ orders: [] });
  });

  it('getOrdersByStore() sends x-user-id header', () => {
    service.getOrdersByStore(10).subscribe();
    const req = httpMock.expectOne(`${base}/stores/10/orders`);
    expect(req.request.headers.get('x-user-id')).toBe('u1');
    req.flush({ orders: [] });
  });

  it('getOrdersByStore() sends x-user-role header', () => {
    service.getOrdersByStore(10).subscribe();
    const req = httpMock.expectOne(`${base}/stores/10/orders`);
    expect(req.request.headers.get('x-user-role')).toBe('seller');
    req.flush({ orders: [] });
  });

  it('getOrderById() GETs /stores/{storeId}/orders/{orderId}', () => {
    service.getOrderById(10, 55).subscribe();
    const req = httpMock.expectOne(`${base}/stores/10/orders/55`);
    expect(req.request.method).toBe('GET');
    req.flush({ order: {} });
  });

  it('updateStatus() PATCHes /stores/{storeId}/orders/{orderId}/status', () => {
    service.updateStatus(10, 55, 'preparing').subscribe();
    const req = httpMock.expectOne(`${base}/stores/10/orders/55/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'preparing' });
    req.flush({ order: {} });
  });

  it('cancelOrder() DELETEs /stores/{storeId}/orders/{orderId}/cancel', () => {
    service.cancelOrder(10, 55).subscribe();
    const req = httpMock.expectOne(`${base}/stores/10/orders/55/cancel`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ order: {} });
  });

  it('completeOrder() PATCHes /stores/{storeId}/orders/{orderId}/complete with otp', () => {
    service.completeOrder(10, 55, '123456').subscribe();
    const req = httpMock.expectOne(`${base}/stores/10/orders/55/complete`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ otp: '123456' });
    req.flush({ data: {} });
  });
});
