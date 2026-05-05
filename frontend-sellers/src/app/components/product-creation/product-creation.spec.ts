import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCreation } from './product-creation';
import { ProductService } from '../../services/products';
import { AuthService } from '../../services/auth';
import { AlertService } from '../../services/alert';
import { TagsService } from '../../services/tags';
import { of, throwError } from 'rxjs';

const mockProductService = {
  createProduct: vi.fn(() => of({ id: 1 })),
};

const mockAuthService = {
  getStoreId: vi.fn(() => '5'),
};

const mockAlertService = {
  showError: vi.fn(),
  showSuccess: vi.fn(),
};

const mockTagsService = {
  updateProductTags: vi.fn(() => of({})),
};

describe('ProductCreation', () => {
  let component: ProductCreation;
  let fixture: ComponentFixture<ProductCreation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCreation],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AlertService, useValue: mockAlertService },
        { provide: TagsService, useValue: mockTagsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCreation);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('openModal sets modalVisible and fetches storeId', () => {
    component.openModal();
    expect(component.modalVisible()).toBe(true);
    expect(component.storeId).toBe('5');
  });

  it('openModal resets form', () => {
    component.formName = 'old';
    component.formPrice = 100;
    component.openModal();
    expect(component.formName).toBe('');
    expect(component.formPrice).toBeNull();
  });

  it('onModalClose hides modal', () => {
    component.modalVisible.set(true);
    component.onModalClose();
    expect(component.modalVisible()).toBe(false);
  });

  it('onModalClose resets form', () => {
    component.formName = 'name';
    component.formPrice = 100;
    component.onModalClose();
    expect(component.formName).toBe('');
    expect(component.formPrice).toBeNull();
  });

  it('onFileSelected sets selectedFile', () => {
    const file = new File(['test'], 'test.txt');
    const event = {
      target: { files: [file] }
    } as any;
    component.onFileSelected(event);
    expect(component.selectedFile).toBe(file);
  });

  it('onFileSelected handles empty files', () => {
    const event = {
      target: { files: [] }
    } as any;
    component.onFileSelected(event);
    expect(component.selectedFile).toBeNull();
  });

  it('getNumericStoreId returns number from storeId', () => {
    component.storeId = '10';
    expect(component.getNumericStoreId()).toBe(10);
  });

  it('getNumericStoreId returns 0 for null storeId', () => {
    component.storeId = null;
    expect(component.getNumericStoreId()).toBe(0);
  });

  it('validateForm rejects empty name', () => {
    const result = component['validateForm']();
    expect(result).toContain('Nombre requerido');
  });

  it('validateForm rejects zero price', () => {
    component.formName = 'Product';
    component.formPrice = 0;
    const result = component['validateForm']();
    expect(result).toContain('Precio');
  });

  it('validateForm rejects null price', () => {
    component.formName = 'Product';
    component.formPrice = null;
    const result = component['validateForm']();
    expect(result).toContain('Precio');
  });

  it('validateForm accepts valid name and price', () => {
    component.formName = 'Product';
    component.formPrice = 50;
    const result = component['validateForm']();
    expect(result).toBeNull();
  });

  it('submitCreate shows error for invalid form', () => {
    component.submitCreate();
    expect(mockAlertService.showError).toHaveBeenCalledWith('Nombre requerido');
  });

  it('submitCreate shows error if no storeId', () => {
    mockAuthService.getStoreId.mockReturnValueOnce('' as any);
    component.formName = 'Product';
    component.formPrice = 50;
    component.submitCreate();
    expect(mockAlertService.showError).toHaveBeenCalledWith('Store ID no encontrado');
  });

  it('submitCreate creates product with JSON payload', () => {
    component.formName = 'Product';
    component.formPrice = 50;
    component.formDescription = 'Desc';
    component.submitCreate();
    expect(mockProductService.createProduct).toHaveBeenCalledWith({
      store_id: 5,
      name: 'Product',
      description: 'Desc',
      price: 50,
      active: true,
    });
  });

  it('submitCreate creates product with FormData if file selected', () => {
    component.formName = 'Product';
    component.formPrice = 50;
    component.selectedFile = new File(['img'], 'test.png');
    component.submitCreate();
    const calls = (mockProductService.createProduct.mock.calls as any[]);
    const call = calls[0]?.[0];
    expect(call).toBeInstanceOf(FormData);
  });

  it('submitCreate saves tags after product creation', () => {
    component.formName = 'Product';
    component.formPrice = 50;
    component.tagSelector = { getSelectedTagIds: () => [1, 2] } as any;
    component.submitCreate();
    expect(mockTagsService.updateProductTags).toHaveBeenCalledWith(1, [1, 2]);
  });

  it('submitCreate shows success and emits event when no tags', () => {
    component.formName = 'Product';
    component.formPrice = 50;
    component.tagSelector = { getSelectedTagIds: () => [] } as any;
    const emitSpy = vi.spyOn(component.productCreated, 'emit');
    component.submitCreate();
    expect(mockAlertService.showSuccess).toHaveBeenCalledWith('Producto creado exitosamente');
    expect(emitSpy).toHaveBeenCalled();
  });

  it('submitCreate handles product creation error', () => {
    mockProductService.createProduct.mockReturnValueOnce(throwError(() => ({ error: { message: 'Server error' } })));
    component.formName = 'Product';
    component.formPrice = 50;
    component.submitCreate();
    expect(mockAlertService.showError).toHaveBeenCalledWith('Server error');
    expect(component.isLoading()).toBe(false);
  });

  it('submitCreate calls productService.createProduct', () => {
    component.formName = 'Product';
    component.formPrice = 50;
    component.submitCreate();
    expect(mockProductService.createProduct).toHaveBeenCalled();
  });
});
