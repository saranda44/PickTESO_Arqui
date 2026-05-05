import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Header } from './header';
import { AuthService } from '../../services/auth';

const mockAuthService = {
  isLoggedIn: vi.fn(() => true),
  logout: vi.fn(),
};

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('isLoggedIn returns auth service value', () => {
    expect(component.isLoggedIn).toBe(mockAuthService.isLoggedIn);
  });

  it('toggleMenu opens menu', () => {
    expect(component.menuOpen()).toBe(false);
    component.toggleMenu();
    expect(component.menuOpen()).toBe(true);
  });

  it('toggleMenu closes menu', () => {
    component.menuOpen.set(true);
    component.toggleMenu();
    expect(component.menuOpen()).toBe(false);
  });

  it('closeMenu closes menu', () => {
    component.menuOpen.set(true);
    component.closeMenu();
    expect(component.menuOpen()).toBe(false);
  });

  it('logout calls auth logout', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('logout closes menu', () => {
    component.menuOpen.set(true);
    component.logout();
    expect(component.menuOpen()).toBe(false);
  });
});
