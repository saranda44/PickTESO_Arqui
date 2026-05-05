import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear();
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get token', () => {
    localStorage.setItem('auth_token', 'test');
    expect(service.getToken()).toBe('test');
  });

  it('should check authentication', () => {
    expect(service.isAuthenticated()).toBe(false);
  });
});
