// product-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IProductWithTags } from '../../interfaces/product.interface';

@Component({
    selector: 'app-product-card',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './product-card.html',
    styleUrls: ['./product-card.scss']
})
export class ProductCardComponent {
    @Input() product!: IProductWithTags;
    @Input() inventory: number = 0;
    @Output() edit = new EventEmitter<IProductWithTags>();
    @Output() delete = new EventEmitter<number>();
    @Output() adjustInventory = new EventEmitter<{ product_id: number; movement_type: 'in' | 'out'; quantity: number }>();

    adjustmentQuantity = 0;

    onEdit() {
        this.edit.emit(this.product);
    }

    onDelete() {
        this.delete.emit(this.product.id);
    }

    addInventory() {
        if (this.adjustmentQuantity > 0) {
            this.adjustInventory.emit({
                product_id: this.product.id,
                movement_type: 'in',
                quantity: this.adjustmentQuantity,
            });
            this.adjustmentQuantity = 0;
        }
    }

    removeInventory() {
        if (this.adjustmentQuantity > 0) {
            this.adjustInventory.emit({
                product_id: this.product.id,
                movement_type: 'out',
                quantity: this.adjustmentQuantity,
            });
            this.adjustmentQuantity = 0;
        }
    }

    get isInactive(): boolean {
        return this.inventory === 0;
    }

    get imageUrl(): string {
        return this.product.product_image || '/assets/placeholder.png';
    }
}