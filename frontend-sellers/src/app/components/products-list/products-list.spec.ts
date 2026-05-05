import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductsList } from './products-list';
import { ProductService } from '../../services/products';
import { InventoryService } from '../../services/inventory';
import { TagsService } from '../../services/tags';
import { AlertService } from '../../services/alert';
import { of, throwError } from 'rxjs';

const mockProductService = {
  getProducts: vi.fn(() => of([
    { id: 1, name: 'Product A', price: 100, description: 'Desc A', active: true, tags: [{ id: 1, name: 'Tag1' }] },
    { id: 2, name: 'Product B', price: 50, description: 'Desc B', active: true, tags: [] }
  ])),
  updateProduct: vi.fn(() => of({})),
  deleteProduct: vi.fn(() => of({})),
};

const mockInventoryService = {
  getStockByProductId: vi.fn((id) => of({ stock: 10, product_id: id })),
  createEntry: vi.fn(() => of({})),
};

const mockTagsService = {
  updateProductTags: vi.fn(() => of({})),
};

const mockAlertService = {
  showSuccess: vi.fn(),
  showError: vi.fn(),
};

describe('ProductsList', () => {
  let component: ProductsList;
  let fixture: ComponentFixture<ProductsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsList],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: TagsService, useValue: mockTagsService },
        { provide: AlertService, useValue: mockAlertService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsList);
    component = fixture.componentInstance;
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit loads products', () => {
    component.ngOnInit();
    expect(mockProductService.getProducts).toHaveBeenCalled();
    expect(component.allProducts().length).toBe(2);
    expect(component.products().length).toBe(2);
  });

  it('ngOnInit loads stock for all products', () => {
    component.ngOnInit();
    expect(mockInventoryService.getStockByProductId).toHaveBeenCalledWith(1);
    expect(mockInventoryService.getStockByProductId).toHaveBeenCalledWith(2);
  });

  it('loadProducts refreshes products', () => {
    component.loadProducts();
    expect(component.allProducts().length).toBe(2);
  });

  it('onSortChange changes sorting', () => {
    component.allProducts.set([
      { id: 2, name: 'B', price: 100 },
      { id: 1, name: 'A', price: 50 }
    ] as any);
    component.onSortChange('nombre');
    expect(component.sortBy()).toBe('nombre');
    expect(component.products()[0].name).toBe('A');
  });

  it('onSortChange sorts by price', () => {
    component.allProducts.set([
      { id: 2, name: 'B', price: 100 },
      { id: 1, name: 'A', price: 50 }
    ] as any);
    component.onSortChange('precio');
    expect(component.sortBy()).toBe('precio');
    expect(component.products()[0].price).toBe(50);
  });

  it('getAvailableTags extracts unique tags from all products', () => {
    component.allProducts.set([
      { id: 1, name: 'P1', tags: [{ id: 1, name: 'Tag1' }] },
      { id: 2, name: 'P2', tags: [{ id: 1, name: 'Tag1' }, { id: 2, name: 'Tag2' }] }
    ] as any);
    const tags = component.getAvailableTags();
    expect(tags.length).toBe(2);
    expect(tags[0].name).toBe('Tag1');
  });

  it('toggleTagFilter adds tag to filter', () => {
    component.toggleTagFilter(1);
    expect(component.isTagFilterSelected(1)).toBe(true);
  });

  it('toggleTagFilter removes tag from filter', () => {
    component.toggleTagFilter(1);
    component.toggleTagFilter(1);
    expect(component.isTagFilterSelected(1)).toBe(false);
  });

  it('toggleTagFilter filters products', () => {
    component.allProducts.set([
      { id: 1, name: 'P1', tags: [{ id: 1, name: 'Tag1' }] },
      { id: 2, name: 'P2', tags: [{ id: 2, name: 'Tag2' }] }
    ] as any);
    component.toggleTagFilter(1);
    expect(component.products().length).toBe(1);
    expect(component.products()[0].id).toBe(1);
  });

  it('onEdit populates form with product data', () => {
    const product = { id: 1, name: 'Product', description: 'Desc', price: 100, active: true, tags: [{ id: 1 }] } as any;
    component.onEdit(product);
    expect(component.selectedProduct()).toBe(product);
    expect(component.formName).toBe('Product');
    expect(component.formDescription).toBe('Desc');
    expect(component.formPrice).toBe(100);
    expect(component.modalVisible()).toBe(true);
  });

  it('onModalClose hides modal and clears selection', () => {
    component.selectedProduct.set({} as any);
    component.modalVisible.set(true);
    component.onModalClose();
    expect(component.modalVisible()).toBe(false);
    expect(component.selectedProduct()).toBeNull();
  });

  it('onFileSelected sets selectedFile', () => {
    const file = new File(['test'], 'test.png');
    const event = {
      target: { files: [file] }
    } as any;
    component.onFileSelected(event);
    expect(component.selectedFile).toBe(file);
  });

  it('submitEdit updates product with FormData if file selected', () => {
    const product = { id: 1, name: 'Old', price: 100 } as any;
    component.selectedProduct.set(product);
    component.formName = 'New';
    component.formPrice = 150;
    component.selectedFile = new File(['img'], 'test.png');
    component.submitEdit();
    const calls = (mockProductService.updateProduct.mock.calls as any[]);
    expect(calls[0]?.[0]).toBe(1);
    expect(calls[0]?.[1]).toBeInstanceOf(FormData);
  });

  it('submitEdit calls saveTags after successful update', () => {
    const product = { id: 1, name: 'Old', price: 100 } as any;
    component.selectedProduct.set(product);
    component.formName = 'New';
    component.tagSelector = { getSelectedTagIds: () => [] } as any;
    component.submitEdit();
    expect(mockAlertService.showSuccess).toHaveBeenCalledWith('Producto actualizado');
  });

  it('submitEdit shows error on failure', () => {
    mockProductService.updateProduct.mockReturnValueOnce(throwError(() => ({ message: 'Error' })));
    const product = { id: 1, name: 'Old', price: 100 } as any;
    component.selectedProduct.set(product);
    component.formName = 'New';
    component.submitEdit();
    expect(mockAlertService.showError).toHaveBeenCalledWith('Error');
  });

  it('onDelete removes product after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.onDelete(1);
    expect(mockProductService.deleteProduct).toHaveBeenCalledWith(1);
  });

  it('onDelete does not remove product if not confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.onDelete(1);
    expect(mockProductService.deleteProduct).not.toHaveBeenCalled();
  });

  it('onAdjustInventory updates inventory and reloads', () => {
    component.onAdjustInventory({ product_id: 1, movement_type: 'in', quantity: 5 });
    expect(mockInventoryService.createEntry).toHaveBeenCalled();
    expect(mockAlertService.showSuccess).toHaveBeenCalledWith('Inventario actualizado');
  });

  it('getInventory returns stock from map', () => {
    component.inventoryMap.set(new Map([[1, 15]]));
    expect(component.getInventory(1)).toBe(15);
  });

  it('getInventory returns 0 for unknown product', () => {
    component.inventoryMap.set(new Map());
    expect(component.getInventory(999)).toBe(0);
  });
});
