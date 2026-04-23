import { Component, inject, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
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

  store: StoreDetails | null = null;
  storeForm!: FormGroup;
  selectedFile: File | null = null;

  loading = false;
  error: string | null = null;
  success: string | null = null;
  showModal = false;

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
    this.loading = true;
    this.error = null;
    this.storeService.getStoreDetails().subscribe({
      next: (data) => {
        this.store = data;
        this.storeForm.patchValue({
          name: data.name,
          location: data.location,
          opening_time: this.formatTime(data.opening_time),
          closing_time: this.formatTime(data.closing_time),
        });
        this.storeForm.enable();
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar tienda';
        this.loading = false;
      },
    });
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedFile = null;
    this.error = null;
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  onSave() {
    if (this.storeForm.invalid) {
      this.error = 'Formulario inválido';
      return;
    }

    const validationError = this.storeService.validateUpdateData(this.storeForm.value);
    if (validationError) {
      this.error = validationError;
      return;
    }

    this.loading = true;
    this.error = null;
    this.storeForm.disable();
    this.storeService.updateStore(this.storeForm.value, this.selectedFile).subscribe({
      next: (updated) => {
        this.store = updated;
        this.success = 'Tienda actualizada exitosamente';
        this.closeModal();
        this.loading = false;
        this.storeForm.enable();
        this.ngZone.run(() => {
          setTimeout(() => {
            this.success = null;
            this.cdr.detectChanges();
          }, 3000);
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al actualizar tienda';
        this.loading = false;
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
