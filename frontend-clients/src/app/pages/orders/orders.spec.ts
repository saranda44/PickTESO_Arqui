import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Orders } from './orders';

describe('Orders', () => {
  let component: Orders;
  let fixture: ComponentFixture<Orders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Orders],
      providers: [{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }],
    }).compileComponents();

    fixture = TestBed.createComponent(Orders);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
