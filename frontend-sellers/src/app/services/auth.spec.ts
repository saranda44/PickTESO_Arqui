import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './auth';
import { environment } from '../../environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('isLoggedIn is false when localStorage is empty', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('isLoggedIn is true when token pre-exists in localStorage', () => {
    localStorage.clear();
    localStorage.setItem('token', 'existing-token');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthService,
      ],
    });
    const freshService = TestBed.inject(AuthService);
    expect(freshService.isLoggedIn()).toBe(true);
  });

  it('login() POSTs to /auth/login with credentials', () => {
    const creds = { email: 'test@test.com', password: '123' };
    service.login(creds).subscribe();
    const req = httpMock.expectOne(`${environment.apiGatewayApiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(creds);
    req.flush({ token: 'tok', userId: '1', storeId: '5', role: 'seller' });
  });

  it('login() stores token in localStorage on success', () => {
    service.login({ email: 'a@b.com', password: 'pw' }).subscribe();
    const req = httpMock.expectOne(`${environment.apiGatewayApiUrl}/auth/login`);
    req.flush({ token: 'my-token', userId: '1', storeId: '5', role: 'seller' });
    expect(localStorage.getItem('token')).toBe('my-token');
  });

  it('login() sets isLoggedIn to true on success', () => {
    service.login({ email: 'a@b.com', password: 'pw' }).subscribe();
    const req = httpMock.expectOne(`${environment.apiGatewayApiUrl}/auth/login`);
    req.flush({ token: 'tok', userId: '1', storeId: '5', role: 'seller' });
    expect(service.isLoggedIn()).toBe(true);
  });

  it('login() navigates to /home on success', () => {
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    service.login({ email: 'a@b.com', password: 'pw' }).subscribe();
    const req = httpMock.expectOne(`${environment.apiGatewayApiUrl}/auth/login`);
    req.flush({ token: 'tok', userId: '1', storeId: '5', role: 'seller' });
    expect(spy).toHaveBeenCalledWith(['/home']);
  });

  it('setToken() stores all four keys in localStorage', () => {
    service.setToken('t1', 'u1', 's1', 'seller');
    expect(localStorage.getItem('token')).toBe('t1');
    expect(localStorage.getItem('userId')).toBe('u1');
    expect(localStorage.getItem('store_id')).toBe('s1');
    expect(localStorage.getItem('role')).toBe('seller');
  });

  it('setToken() with null optionals only stores token', () => {
    service.setToken('t2', null, null, null);
    expect(localStorage.getItem('token')).toBe('t2');
    expect(localStorage.getItem('userId')).toBeNull();
    expect(localStorage.getItem('store_id')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
  });

  it('setToken() sets isLoggedIn to true', () => {
    service.setToken('tok');
    expect(service.isLoggedIn()).toBe(true);
  });

  it('logout() clears all localStorage keys', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('userId', 'u1');
    localStorage.setItem('store_id', 's1');
    localStorage.setItem('role', 'seller');
    service.logout();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userId')).toBeNull();
    expect(localStorage.getItem('store_id')).toBeNull();
    expect(localStorage.getItem('role')).toBeNull();
  });

  it('logout() sets isLoggedIn to false', () => {
    service.setToken('tok');
    service.logout();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('logout() navigates to /login', () => {
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    service.logout();
    expect(spy).toHaveBeenCalledWith(['/login']);
  });

  it('getToken() returns token from localStorage', () => {
    localStorage.setItem('token', 'abc');
    expect(service.getToken()).toBe('abc');
  });

  it('getUserId() returns userId from localStorage', () => {
    localStorage.setItem('userId', '42');
    expect(service.getUserId()).toBe('42');
  });

  it('getStoreId() returns store_id from localStorage', () => {
    localStorage.setItem('store_id', '7');
    expect(service.getStoreId()).toBe('7');
  });

  it('getUserRole() returns role from localStorage', () => {
    localStorage.setItem('role', 'admin');
    expect(service.getUserRole()).toBe('admin');
  });
});
