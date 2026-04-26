import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCreation } from './product-creation';

describe('ProductCreation', () => {
  let component: ProductCreation;
  let fixture: ComponentFixture<ProductCreation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCreation],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCreation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
