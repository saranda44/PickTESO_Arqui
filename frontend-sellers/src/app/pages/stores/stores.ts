import { Component, inject, OnInit, NgZone, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService, StoreDetails } from '../../services/store';

@Component({
  selector: 'app-stores',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stores.html',
  styleUrl: './stores.scss',
})
export class Stores implements OnInit {

  storeService = inject(StoreService);
  fb = inject(FormBuilder);
  ngZone = inject(NgZone);
  cdr = inject(ChangeDetectorRef);

  store = signal<StoreDetails | null>(null);
  storeForm!: FormGroup;
  selectedFile: File | null = null;

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  showModal = signal(false);

  ngOnInit() {
    this.loadStore();
    this.initForm();
  }

  private initForm() {
    this.storeForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      location: [''],
      opening_time: ['', Validators.pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)],
      closing_time: ['', Validators.pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)],
    });
  }

  loadStore() {
    this.loading.set(true);
    this.error.set(null);
    this.storeService.getStoreDetails().subscribe({
      next: (data) => {
        this.store.set(data);
        this.storeForm.patchValue({
          name: data.name,
          location: data.location,
          opening_time: this.formatTime(data.opening_time),
          closing_time: this.formatTime(data.closing_time),
        });
        this.storeForm.enable();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar tienda');
        this.loading.set(false);
      },
    });
  }

  openModal() {
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedFile = null;
    this.error.set(null);
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  onSave() {
    if (this.storeForm.invalid) {
      this.error.set('Formulario inválido');
      return;
    }

    const validationError = this.storeService.validateUpdateData(this.storeForm.value);
    if (validationError) {
      this.error.set(validationError);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.storeForm.disable();
    this.storeService.updateStore(this.storeForm.value, this.selectedFile).subscribe({
      next: (updated) => {
        this.store.set(updated);
        this.success.set('Tienda actualizada exitosamente');
        this.closeModal();
        this.loading.set(false);
        this.storeForm.enable();
        setTimeout(() => {
          this.success.set(null);
        }, 3000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Error al actualizar tienda');
        this.loading.set(false);
        this.storeForm.enable();
      },
    });
  }

  formatTime(time: string | undefined): string {
    if (!time) return '';
    // Format: "11:00:00" -> "11:00"
    return time.substring(0, 5);
  }

}
