import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AuthGuard, authGuard, publicGuard } from './auth.guard';
import { AuthService } from '../services/auth';

function makeAuthMock(loggedIn: boolean) {
  return {
    isLoggedIn: signal(loggedIn),
    getToken: () => null,
    getUserId: () => null,
    getUserRole: () => null,
    getStoreId: () => null,
  };
}

const fakeRoute = {} as ActivatedRouteSnapshot;
const fakeState = {} as RouterStateSnapshot;

describe('authGuard', () => {
  it('returns true when user is logged in', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: makeAuthMock(true) },
        AuthGuard,
      ],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const result = TestBed.runInInjectionContext(() => authGuard(fakeRoute, fakeState));
    expect(result).toBe(true);
  });

  it('returns false and navigates to /login when not logged in', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: makeAuthMock(false) },
        AuthGuard,
      ],
    });
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const result = TestBed.runInInjectionContext(() => authGuard(fakeRoute, fakeState));
    expect(result).toBe(false);
    expect(spy).toHaveBeenCalledWith(['/login']);
  });
});

describe('publicGuard', () => {
  it('returns true when user is NOT logged in', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: makeAuthMock(false) },
      ],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const result = TestBed.runInInjectionContext(() => publicGuard(fakeRoute, fakeState));
    expect(result).toBe(true);
  });

  it('returns false and navigates to /home when already logged in', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: makeAuthMock(true) },
      ],
    });
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const result = TestBed.runInInjectionContext(() => publicGuard(fakeRoute, fakeState));
    expect(result).toBe(false);
    expect(spy).toHaveBeenCalledWith(['/home']);
  });
});
