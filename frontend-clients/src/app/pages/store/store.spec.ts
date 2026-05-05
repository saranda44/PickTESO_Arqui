import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { Store } from './store';

describe('Store', () => {
  let component: Store;
  let fixture: ComponentFixture<Store>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Store],
      providers: [{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Store);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
