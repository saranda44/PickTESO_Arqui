import { Component, Input, Output, EventEmitter, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagsService, ITag } from '../../services/tags';
import { AlertService } from '../../services/alert';

@Component({
  selector: 'app-tag-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tag-selector.html',
  styleUrls: ['./tag-selector.scss']
})
export class TagSelectorComponent implements OnInit {
  @Input() storeId!: number;
  @Input() productId?: number;
  @Input() selectedTagIds: number[] = [];
  @Output() tagsSaved = new EventEmitter<number[]>();

  private tagsService = inject(TagsService);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);

  allTags = signal<ITag[]>([]);
  selectedTags = new Set<number>();
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    // console.log('TagSelectorComponent init - storeId:', this.storeId);
    if (!this.storeId) {
      this.error.set('Store ID no disponible');
      return;
    }
    this.loadTags();
    this.selectedTags = new Set(this.selectedTagIds);
  }

  loadTags() {
    // console.log('Loading tags for storeId:', this.storeId);
    this.loading.set(true);
    this.error.set(null);
    this.tagsService.getTagsByStoreId(this.storeId).subscribe({
      next: (tags) => {
        // console.log('Tags loaded:', tags);
        this.allTags.set(tags);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading tags:', err);
        this.error.set('Error cargando tags. Intenta de nuevo.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      complete: () => {
        console.log('Tags loading complete');
      }
    });
  }

  toggleTag(tagId: string | number) {
    const id = Number(tagId);
    if (this.selectedTags.has(id)) {
      this.selectedTags.delete(id);
    } else {
      this.selectedTags.add(id);
    }
  }

  isSelected(tagId: string | number): boolean {
    return this.selectedTags.has(Number(tagId));
  }

  getSelectedTagIds(): number[] {
    return Array.from(this.selectedTags);
  }
}
