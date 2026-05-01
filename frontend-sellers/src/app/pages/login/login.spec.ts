import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Login } from './login';
import { AuthService } from '../../services/auth';

function makeAuthMock(loggedIn: boolean) {
  return {
    isLoggedIn: signal(loggedIn),
    setToken: vi.fn(),
    getToken: () => null,
    logout: vi.fn(),
  };
}

function setup(authMock: ReturnType<typeof makeAuthMock>, routeMock?: object) {
  const fakeRoute = routeMock ?? {
    snapshot: { queryParamMap: { get: (_: string) => null } },
  };
  return TestBed.configureTestingModule({
    imports: [Login],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: authMock },
      { provide: ActivatedRoute, useValue: fakeRoute },
    ],
  }).compileComponents();
}

describe('Login', () => {
  it('should create when not logged in', async () => {
    await setup(makeAuthMock(false));
    const fixture = TestBed.createComponent(Login);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('ngOnInit redirects to /home when already logged in', async () => {
    const authMock = makeAuthMock(true);
    await setup(authMock);
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(['/home']);
  });

  it('ngOnInit calls setToken when token query param is present', async () => {
    const authMock = makeAuthMock(false);
    const routeWithToken = {
      snapshot: {
        queryParamMap: {
          get: (k: string) => ({ token: 'abc', id: '1', storeId: '5', role: 'seller' }[k] ?? null),
        },
      },
    };
    await setup(authMock, routeWithToken);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    expect(authMock.setToken).toHaveBeenCalledWith('abc', '1', '5', 'seller');
  });
});
