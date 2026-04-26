// products-list.component.ts
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IProductWithTags } from '../../interfaces/product.interface';
import { ProductService } from '../../services/products';
import { InventoryService } from '../../services/inventory';
import { TagsService } from '../../services/tags';
import { ProductCardComponent } from '../product-card/product-card';
import { ReusableModalComponent } from '../reusable-modal/reusable-modal';
import { TagSelectorComponent } from '../tag-selector/tag-selector';
import { AlertService } from '../../services/alert';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [ProductCardComponent, CommonModule, ReusableModalComponent, FormsModule, TagSelectorComponent],
  templateUrl: './products-list.html',
  styleUrls: ['./products-list.scss'],
})
export class ProductsList implements OnInit {
  @ViewChild(TagSelectorComponent) tagSelector?: TagSelectorComponent;

  private productService = inject(ProductService);
  private inventoryService = inject(InventoryService);
  private tagsService = inject(TagsService);
  private alertService = inject(AlertService);

  products = signal<IProductWithTags[]>([]);
  inventoryMap = signal<Map<number, number>>(new Map());

  // Sorting & Filtering
  sortBy = signal<'nombre' | 'precio'>('nombre');
  allProducts = signal<IProductWithTags[]>([]);
  selectedTagsFilter = signal<Set<number>>(new Set());

  // Modal state and form fields
  modalVisible = signal(false);
  modalTitle = signal('Editar producto');
  selectedProduct = signal<IProductWithTags | null>(null);
  formName = '';
  formDescription = '';
  formPrice: number | null = null;
  formActive = true;
  selectedFile: File | null = null;
  selectedTagIds: number[] = [];

  ngOnInit() {
    this.productService.getProducts().subscribe({
      next: (data: any) => {
        const items = Array.isArray(data) ? data : data.products;
        this.allProducts.set(items);
        this.products.set(this.getFilteredAndSortedProducts(items));
        this.loadStockForAllProductsInitial(items);
      },
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  // products-list.component.ts
  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (data: any) => {
        const items = Array.isArray(data) ? data : data.products;
        this.allProducts.set(items);
        this.products.set(this.getFilteredAndSortedProducts(items));
        this.loadStockForAllProducts(items);
      },
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  onSortChange(value: 'nombre' | 'precio') {
    this.sortBy.set(value);
    this.products.set(this.getFilteredAndSortedProducts(this.allProducts()));
  }

  private getSortedProducts(items: IProductWithTags[]): IProductWithTags[] {
    const sorted = [...items];
    if (this.sortBy() === 'nombre') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      sorted.sort((a, b) => a.price - b.price);
    }
    return sorted;
  }

  private getFilteredAndSortedProducts(items: IProductWithTags[]): IProductWithTags[] {
    const selectedTags = this.selectedTagsFilter();
    let filtered = items;

    if (selectedTags.size > 0) {
      filtered = items.filter(product => {
        const productTagIds = product.tags?.map(t => t.id) ?? [];
        return productTagIds.some(tagId => selectedTags.has(tagId));
      });
    }

    return this.getSortedProducts(filtered);
  }

  getAvailableTags(): any[] {
    const tagsMap = new Map<number, any>();
    this.allProducts().forEach(product => {
      product.tags?.forEach(tag => {
        if (!tagsMap.has(tag.id)) {
          tagsMap.set(tag.id, tag);
        }
      });
    });
    return Array.from(tagsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  toggleTagFilter(tagId: number) {
    const newSet = new Set(this.selectedTagsFilter());
    if (newSet.has(tagId)) {
      newSet.delete(tagId);
    } else {
      newSet.add(tagId);
    }
    this.selectedTagsFilter.set(newSet);
    this.products.set(this.getFilteredAndSortedProducts(this.allProducts()));
  }

  isTagFilterSelected(tagId: number): boolean {
    return this.selectedTagsFilter().has(tagId);
  }

  loadStockForAllProductsInitial(items: IProductWithTags[]) {
    const initialMap = new Map(this.inventoryMap());
    items.forEach(product => {
      initialMap.set(product.id, 1);
    });
    this.inventoryMap.set(initialMap);

    items.forEach(product => {
      this.inventoryService.getStockByProductId(product.id).subscribe({
        next: (response) => {
          const newMap = new Map(this.inventoryMap());
          newMap.set(product.id, response.stock);
          this.inventoryMap.set(newMap);
        },
        error: (err) => console.error(`Error cargando stock producto ${product.id}`, err)
      });
    });
  }

  loadStockForAllProducts(items: IProductWithTags[]) {
    items.forEach(product => {
      this.inventoryService.getStockByProductId(product.id).subscribe({
        next: (response) => {
          const newMap = new Map(this.inventoryMap());
          newMap.set(product.id, response.stock);
          this.inventoryMap.set(newMap);
        },
        error: (err) => console.error(`Error cargando stock producto ${product.id}`, err)
      });
    });
  }

  onEdit(product: IProductWithTags) {
    this.selectedProduct.set(product);
    this.formName = product.name ?? '';
    this.formDescription = product.description ?? '';
    this.formPrice = product.price ?? null;
    this.formActive = product.active ?? true;
    this.selectedFile = null;
    this.selectedTagIds = product.tags?.map(t => t.id) ?? [];
    this.modalTitle.set('Editar producto');
    this.modalVisible.set(true);
  }

  private getChangedFields() {
    const product = this.selectedProduct();
    if (!product) return {};

    const changes: any = {};
    if (this.formName !== product.name) changes.name = this.formName;
    if (this.formDescription !== product.description) changes.description = this.formDescription;
    if (this.formPrice !== product.price) changes.price = this.formPrice;
    if (this.formActive !== product.active) changes.active = this.formActive;
    return changes;
  }

  onModalClose() {
    this.modalVisible.set(false);
    this.selectedProduct.set(null);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
  }

  submitEdit() {
    const product = this.selectedProduct();
    if (!product) return;

    const payload = this.getChangedFields();
    const hasChanges = Object.keys(payload).length > 0;

    if (!this.selectedFile && !hasChanges) {
      this.saveTags(product.id);
      return;
    }

    let request$;
    if (this.selectedFile) {
      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        const val = (payload as any)[key];
        if (val !== undefined && val !== null) formData.append(key, String(val));
      });
      formData.append('image', this.selectedFile);
      request$ = this.productService.updateProduct(product.id, formData);
    } else {
      request$ = this.productService.updateProduct(product.id, payload);
    }

    request$.subscribe({
      next: () => {
        this.saveTags(product.id);
      },
      error: (err: any) => this.alertService.showError(err.message || String(err))
    });
  }

  saveTags(productId: number) {
    const tagIds = this.tagSelector?.getSelectedTagIds() ?? [];

    if (tagIds.length === 0) {
      this.alertService.showSuccess('Producto actualizado');
      this.loadProducts();
      this.onModalClose();
      return;
    }

    this.tagsService.updateProductTags(productId, tagIds).subscribe({
      next: () => {
        this.alertService.showSuccess('Producto y tags actualizados');
        this.loadProducts();
        this.onModalClose();
      },
      error: (err) => {
        this.alertService.showError('Error actualizando tags');
        this.loadProducts();
        this.onModalClose();
      }
    });
  }

  onDelete(productId: number) {
    if (confirm('¿Eliminar producto?')) {
      this.productService.deleteProduct(productId).subscribe({
        next: () => this.loadProducts(),
        error: (err) => console.error('Error eliminando', err)
      });
    }
  }

  onAdjustInventory(data: any) {
    this.inventoryService.createEntry(data).subscribe({
      next: () => {
        this.alertService.showSuccess('Inventario actualizado');
        this.loadProducts();
      },
      error: (err: Error) => this.alertService.showError(err.message)
    });
  }

  getInventory(productId: number): number {
    return this.inventoryMap().get(productId) || 0;
  }

  onTagsSaved(tagIds: number[]) {
    this.selectedTagIds = tagIds;
    this.loadProducts();
  }
}