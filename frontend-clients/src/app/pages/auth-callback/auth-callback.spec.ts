import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { AuthCallback } from './auth-callback';

describe('AuthCallback', () => {
  let component: AuthCallback;
  let fixture: ComponentFixture<AuthCallback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCallback],
      providers: [{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } }, queryParams: of({}) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthCallback);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
