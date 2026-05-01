import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { StoreService } from './store';
import { AuthService } from './auth';
import { environment } from '../../environment';

const mockAuthService = {
  getStoreId: () => '5',
  getToken: () => 'tok',
  getUserId: () => '1',
  getUserRole: () => 'seller',
  isLoggedIn: () => true,
};

describe('StoreService', () => {
  let service: StoreService;
  let httpMock: HttpTestingController;
  const base = environment.sellersApiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        StoreService,
      ],
    });
    service = TestBed.inject(StoreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('validateUpdateData()', () => {
    it('returns null for empty object', () => {
      expect(service.validateUpdateData({})).toBeNull();
    });

    it('returns error when name is empty string', () => {
      expect(service.validateUpdateData({ name: '' })).toBeNull();
    });

    it('returns error when name exceeds 100 characters', () => {
      const longName = 'x'.repeat(101);
      expect(service.validateUpdateData({ name: longName })).toMatch(/100/);
    });

    it('returns error for invalid opening_time format', () => {
      expect(service.validateUpdateData({ opening_time: '25:00' })).toMatch(/HH:mm/);
    });

    it('returns error for invalid closing_time format', () => {
      expect(service.validateUpdateData({ closing_time: 'abc' })).toMatch(/HH:mm/);
    });

    it('returns error when opening_time >= closing_time', () => {
      expect(service.validateUpdateData({ opening_time: '10:00', closing_time: '09:00' }))
        .toMatch(/apertura/i);
    });

    it('returns null for valid opening and closing times', () => {
      expect(service.validateUpdateData({ opening_time: '08:00', closing_time: '17:00' })).toBeNull();
    });

    it('returns error when opening_time equals closing_time', () => {
      expect(service.validateUpdateData({ opening_time: '09:00', closing_time: '09:00' }))
        .not.toBeNull();
    });
  });

  it('getStoreDetails() GETs /stores/{storeId}', () => {
    service.getStoreDetails().subscribe();
    const req = httpMock.expectOne(`${base}/stores/5`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('updateStore() PUTs FormData to /stores/{storeId}', () => {
    service.updateStore({ name: 'New Name' }).subscribe();
    const req = httpMock.expectOne(`${base}/stores/5`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toBeInstanceOf(FormData);
    req.flush({});
  });
});
