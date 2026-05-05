import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
    service = TestBed.inject(CartService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add product to cart', () => {
    const product = { id: 1, name: 'Product 1', price: 100 };
    service.addToCart(product);
    expect(service.items().length).toBe(1);
  });

  it('should get total', () => {
    service.addToCart({ id: 1, name: 'P1', price: 100 });
    expect(service.getTotal()).toBe(100);
  });

  it('should remove product from cart', () => {
    service.addToCart({ id: 1, name: 'P1', price: 100 });
    service.removeFromCart(1);
    expect(service.items().length).toBe(0);
  });

  it('should count items', () => {
    service.addToCart({ id: 1, name: 'P1', price: 100 });
    service.addToCart({ id: 1, name: 'P1', price: 100 });
    expect(service.count()).toBe(2);
  });

  it('should clear cart', () => {
    service.addToCart({ id: 1, name: 'P1', price: 100 });
    service.clearCart();
    expect(service.items().length).toBe(0);
  });

  it('should set and get store id', () => {
    service.setStoreId(42);
    expect(service.getStoreId()).toBe(42);
  });
});
