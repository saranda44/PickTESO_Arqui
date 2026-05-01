import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './products';
import { AuthService } from './auth';
import { environment } from '../../environment';

const mockAuthService = {
  getStoreId: () => '5',
  getToken: () => 'tok',
  getUserId: () => '1',
  getUserRole: () => 'seller',
  isLoggedIn: () => true,
};

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  const base = environment.sellersApiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        ProductService,
      ],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getProducts() GETs /products/store/{storeId}', () => {
    service.getProducts().subscribe();
    const req = httpMock.expectOne(`${base}/products/store/5`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getProducts() adds default color #999999 when tag has no color', () => {
    let result: any[];
    service.getProducts().subscribe(r => result = r);
    httpMock.expectOne(`${base}/products/store/5`).flush([
      { id: 1, name: 'Prod', tags: [{ id: 1, name: 'tag1' }] }
    ]);
    expect(result![0].tags[0].color).toBe('#999999');
  });

  it('getProducts() preserves existing tag color', () => {
    let result: any[];
    service.getProducts().subscribe(r => result = r);
    httpMock.expectOne(`${base}/products/store/5`).flush([
      { id: 1, name: 'Prod', tags: [{ id: 1, name: 'tag1', color: '#ff0000' }] }
    ]);
    expect(result![0].tags[0].color).toBe('#ff0000');
  });

  it('getProductById() GETs /products/{id}', () => {
    service.getProductById(99).subscribe();
    const req = httpMock.expectOne(`${base}/products/99`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('updateProduct() PUTs to /products/{id}', () => {
    const payload = { name: 'Updated' };
    service.updateProduct(3, payload).subscribe();
    const req = httpMock.expectOne(`${base}/products/3`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('deleteProduct() DELETEs /products/{id}', () => {
    service.deleteProduct(7).subscribe();
    const req = httpMock.expectOne(`${base}/products/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('createProduct() POSTs to /products', () => {
    const payload = { name: 'New', price: 100 };
    service.createProduct(payload).subscribe();
    const req = httpMock.expectOne(`${base}/products`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('adjustInventory() POSTs to /inventory with correct body', () => {
    service.adjustInventory(3, 'in', 10).subscribe();
    const req = httpMock.expectOne(`${base}/inventory`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ product_id: 3, movement_type: 'in', quantity: 10 });
    req.flush({});
  });

  it('adjustInventory() supports movement_type out', () => {
    service.adjustInventory(5, 'out', 2).subscribe();
    const req = httpMock.expectOne(`${base}/inventory`);
    expect(req.request.body.movement_type).toBe('out');
    req.flush({});
  });
});
