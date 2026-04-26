import { Component, inject, OnInit, OnDestroy, signal, Output, EventEmitter, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TagsService, ITag } from '../../services/tags';
import { AuthService } from '../../services/auth';
import { AlertService } from '../../services/alert';
import { ReusableModalComponent } from '../reusable-modal/reusable-modal';

type ViewType = 'list' | 'detail' | 'form';
type FormMode = 'create' | 'edit';

interface TagForm {
  name: string;
  description: string;
  color: string;
  start_time: string;
  end_time: string;
}

const DEFAULT_FORM: TagForm = {
  name: '',
  description: '',
  color: '#999999',
  start_time: '00:00',
  end_time: '23:59',
};

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [CommonModule, FormsModule, ReusableModalComponent],
  templateUrl: './tags.html',
  styleUrl: './tags.scss',
})
export class Tags implements OnInit, OnDestroy {
  @Output() tagsUpdated = new EventEmitter<void>();

  private tagsService = inject(TagsService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);

  modalVisible = signal(false);
  currentView = signal<ViewType>('list');
  formMode = signal<FormMode>('create');
  isLoading = signal(false);
  showDeleteConfirm = signal(false);

  tags = signal<ITag[]>([]);
  selectedTag = signal<ITag | null>(null);
  formData = signal<TagForm>({ ...DEFAULT_FORM });

  ngOnInit() {
    this.loadTags();
  }

  ngOnDestroy() {}

  openModal() {
    this.modalVisible.set(true);
    this.currentView.set('list');
  }

  closeModal() {
    this.modalVisible.set(false);
    this.currentView.set('list');
    this.formData.set({ ...DEFAULT_FORM });
  }

  loadTags() {
    const storeId = this.authService.getStoreId();
    if (!storeId) {
      this.alertService.showError('Store ID no encontrado');
      return;
    }

    this.tagsService.getTagsByStoreId(Number(storeId))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const tagsWithDefaults = data.map(tag => ({
            ...tag,
            color: tag.color || '#999999'
          }));
          this.tags.set(tagsWithDefaults);
        },
        error: (err) => {
          this.alertService.showError('Error cargando tags');
          console.error(err);
        }
      });
  }

  selectTag(tag: ITag) {
    this.selectedTag.set(tag);
    this.currentView.set('detail');
  }

  backToList() {
    this.currentView.set('list');
    this.selectedTag.set(null);
    this.formData.set({ ...DEFAULT_FORM });
  }

  openCreateForm() {
    this.formMode.set('create');
    this.formData.set({ ...DEFAULT_FORM });
    this.currentView.set('form');
  }

  openEditForm() {
    const tag = this.selectedTag();
    if (!tag) return;

    this.formMode.set('edit');
    this.formData.set({
      name: tag.name,
      description: tag.description || '',
      color: tag.color,
      start_time: tag.start_time || '',
      end_time: tag.end_time || '',
    });
    this.currentView.set('form');
  }

  confirmDelete() {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete() {
    this.showDeleteConfirm.set(false);
  }

  deleteTag() {
    const tag = this.selectedTag();
    if (!tag) return;

    this.showDeleteConfirm.set(false);
    this.isLoading.set(true);

    this.tagsService.deleteTag(tag.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.alertService.showSuccess('Tag eliminado');
          this.loadTags();
          this.tagsUpdated.emit();
          this.backToList();
          this.isLoading.set(false);
        },
        error: () => {
          this.alertService.showError('Error eliminando tag');
          this.isLoading.set(false);
        }
      });
  }

  submitForm() {
    if (!this.validateForm()) return;

    this.isLoading.set(true);
    const form = this.formData();

    if (this.formMode() === 'create') {
      this.createTag(form);
    } else {
      this.updateTag(form);
    }
  }

  private createTag(form: TagForm) {
    const storeId = this.authService.getStoreId();
    if (!storeId) {
      this.alertService.showError('Store ID no encontrado');
      this.isLoading.set(false);
      return;
    }

    const payload = this.buildPayload(form, Number(storeId), false);

    this.tagsService.createTag(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.alertService.showSuccess('Tag creado');
          this.loadTags();
          this.tagsUpdated.emit();
          this.backToList();
          this.isLoading.set(false);
        },
        error: (err) => {
          this.alertService.showError(err.error?.message || 'Error creando tag');
          this.isLoading.set(false);
        }
      });
  }

  private updateTag(form: TagForm) {
    const tag = this.selectedTag();
    if (!tag) return;

    const payload = this.buildPayload(form, tag.store_id, true);

    this.tagsService.updateTag(tag.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.alertService.showSuccess('Tag actualizado');
          this.loadTags();
          this.tagsUpdated.emit();
          this.backToList();
          this.isLoading.set(false);
        },
        error: (err) => {
          this.alertService.showError(err.error?.message || 'Error actualizando tag');
          this.isLoading.set(false);
        }
      });
  }

  private buildPayload(form: TagForm, storeId: number, isUpdate: boolean = false) {
    const payload: any = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      color: form.color,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
    };

    if (!isUpdate) {
      payload.store_id = storeId;
      payload.active = true;
    }

    return payload;
  }

  private validateForm(): boolean {
    const form = this.formData();
    if (!form.name.trim()) {
      this.alertService.showError('Nombre requerido');
      return false;
    }
    return true;
  }
}
