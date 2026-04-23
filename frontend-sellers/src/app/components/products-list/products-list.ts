// products-list.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IProductWithTags } from '../../interfaces/product.interface';
import { ProductService } from '../../services/products';
import { InventoryService } from '../../services/inventory';
import { ProductCardComponent } from '../product-card/product-card';
import { ReusableModalComponent } from '../reusable-modal/reusable-modal';
import { Alert } from '../../shared/alert/alert';
import { AlertService } from '../../services/alert';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [ProductCardComponent, CommonModule, ReusableModalComponent, FormsModule],
  templateUrl: './products-list.html',
  styleUrls: ['./products-list.scss'],
})
export class ProductsList implements OnInit {
  private productService = inject(ProductService);
  private inventoryService = inject(InventoryService);
  private alertService = inject(AlertService);

  products = signal<IProductWithTags[]>([]);
  inventoryMap = signal<Map<number, number>>(new Map());
  error = signal<string | null>(null);

  // Modal state and form fields
  modalVisible = signal(false);
  modalTitle = signal('Editar producto');
  selectedProduct = signal<IProductWithTags | null>(null);
  formName = '';
  formDescription = '';
  formPrice: number | null = null;
  formActive = true;
  selectedFile: File | null = null;

  ngOnInit() {
    this.loadProducts();
  }

  // products-list.component.ts
  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (data: any) => {
        console.log('Productos recibidos:', data);
        const items = Array.isArray(data) ? data : data.products;
        this.products.set(items);
        this.loadStockForAllProducts(items);
      },
      error: (err) => console.error('Error cargando productos', err)
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
    // Open modal and preload form
    this.selectedProduct.set(product);
    this.formName = product.name ?? '';
    this.formDescription = product.description ?? '';
    this.formPrice = product.price ?? null;
    this.formActive = product.active ?? true;
    this.selectedFile = null;
    this.modalTitle.set('Editar producto');
    this.modalVisible.set(true);
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

    const payload: any = {
      name: this.formName,
      description: this.formDescription,
      price: this.formPrice,
      active: this.formActive,
    };

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
        this.alertService.showSuccess('Producto actualizado');
        this.loadProducts();
        this.onModalClose();
      },
      error: (err: any) => this.alertService.showError(err.message || String(err))
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
}