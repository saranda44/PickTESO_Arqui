import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { InventoryService } from './inventory';
import { environment } from '../../environment';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpMock: HttpTestingController;
  const base = `${environment.sellersApiUrl}/inventory`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        InventoryService,
      ],
    });
    service = TestBed.inject(InventoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('createEntry() POSTs to /inventory', () => {
    const payload = { product_id: 1, movement_type: 'in', quantity: 5 };
    service.createEntry(payload).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('createEntry() handles error via HttpErrorHandler', () => {
    let errorMsg: string | undefined;
    service.createEntry({}).subscribe({
      error: (e) => errorMsg = e.message,
    });
    const req = httpMock.expectOne(base);
    req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    expect(errorMsg).toBe('Not found');
  });

  it('deleteEntry() DELETEs /inventory/{id}', () => {
    service.deleteEntry(3).subscribe();
    const req = httpMock.expectOne(`${base}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(true);
  });

  it('getEntriesByProductId() GETs /inventory/product/{productId}', () => {
    service.getEntriesByProductId(7).subscribe();
    const req = httpMock.expectOne(`${base}/product/7`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getStockByProductId() GETs /inventory/product/{productId}/stock', () => {
    service.getStockByProductId(7).subscribe();
    const req = httpMock.expectOne(`${base}/product/7/stock`);
    expect(req.request.method).toBe('GET');
    req.flush({ product_id: 7, stock: 10 });
  });
});
