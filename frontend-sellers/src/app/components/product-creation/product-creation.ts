import { Component, inject, signal, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/products';
import { AuthService } from '../../services/auth';
import { AlertService } from '../../services/alert';
import { TagsService } from '../../services/tags';
import { ReusableModalComponent } from '../reusable-modal/reusable-modal';
import { TagSelectorComponent } from '../tag-selector/tag-selector';

@Component({
  selector: 'app-product-creation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReusableModalComponent, TagSelectorComponent],
  templateUrl: './product-creation.html',
  styleUrl: './product-creation.scss',
})
export class ProductCreation {
  @Output() productCreated = new EventEmitter<void>();
  @ViewChild(TagSelectorComponent) tagSelector?: TagSelectorComponent;

  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private tagsService = inject(TagsService);
  private alertService = inject(AlertService);

  modalVisible = signal(false);
  isLoading = signal(false);

  formName = '';
  formDescription = '';
  formPrice: number | null = null;
  selectedFile: File | null = null;
  storeId: string | null = null;

  openModal() {
    this.resetForm();
    this.storeId = this.authService.getStoreId();
    this.modalVisible.set(true);
  }

  onModalClose() {
    this.modalVisible.set(false);
    this.resetForm();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  getNumericStoreId(): number {
    return this.storeId ? Number(this.storeId) : 0;
  }

  private resetForm() {
    this.formName = '';
    this.formDescription = '';
    this.formPrice = null;
    this.selectedFile = null;
  }

  private validateForm(): string | null {
    if (!this.formName.trim()) return 'Nombre requerido';
    if (!this.formPrice || this.formPrice <= 0) return 'Precio debe ser mayor a 0';
    return null;
  }

  submitCreate() {
    const error = this.validateForm();
    if (error) {
      this.alertService.showError(error);
      return;
    }

    const storeId = this.authService.getStoreId();
    if (!storeId) {
      this.alertService.showError('Store ID no encontrado');
      return;
    }

    this.isLoading.set(true);

    const payload: any = {
      store_id: Number(storeId),
      name: this.formName,
      description: this.formDescription || null,
      price: this.formPrice,
      active: true,
    };

    let request$;
    if (this.selectedFile) {
      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        const val = (payload as any)[key];
        if (val !== undefined && val !== null) formData.append(key, String(val));
      });
      formData.append('image', this.selectedFile);
      request$ = this.productService.createProduct(formData);
    } else {
      request$ = this.productService.createProduct(payload);
    }

    request$.subscribe({
      next: (product: any) => {
        this.saveTags(product.id);
      },
      error: (err: any) => {
        this.alertService.showError(err.error?.message || 'Error al crear producto');
        this.isLoading.set(false);
      }
    });
  }

  private saveTags(productId: number) {
    const tagIds = this.tagSelector?.getSelectedTagIds() ?? [];

    if (tagIds.length === 0) {
      this.alertService.showSuccess('Producto creado exitosamente');
      this.productCreated.emit();
      this.onModalClose();
      this.isLoading.set(false);
      return;
    }

    this.tagsService.updateProductTags(productId, tagIds).subscribe({
      next: () => {
        this.alertService.showSuccess('Producto creado con tags');
        this.productCreated.emit();
        this.onModalClose();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.alertService.showError('Producto creado pero error guardando tags');
        this.productCreated.emit();
        this.onModalClose();
        this.isLoading.set(false);
      }
    });
  }
}
