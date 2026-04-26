import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IProductWithTags } from '../../interfaces/product.interface';
import { AlertService } from '../../services/alert';

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

    private alertService = inject(AlertService);
    private _adjustmentQuantity = 0;

    set adjustmentQuantity(value: number) {
        this._adjustmentQuantity = Math.max(0, value);
    }

    get adjustmentQuantity(): number {
        return this._adjustmentQuantity;
    }

    onEdit() {
        this.edit.emit(this.product);
    }

    onDelete() {
        this.delete.emit(this.product.id);
    }

    addInventory() {
        const qty = this.getValidQuantity();
        if (!qty) return;

        this.emitAdjustment(qty, 'in', `+${qty} unidades agregadas`);
    }

    removeInventory() {
        const qty = this.getValidQuantity();
        if (!qty) return;

        if (this.inventory < qty) {
            this.alertService.showError(`Stock insuficiente. Disponible: ${this.inventory}`);
            return;
        }

        this.emitAdjustment(qty, 'out', `-${qty} unidades removidas`);
    }

    incrementQty() {
        this.adjustmentQuantity++;
    }

    decrementQty() {
        if (this.adjustmentQuantity > 0) {
            this.adjustmentQuantity--;
        }
    }

    private getValidQuantity(): number | null {
        const qty = Number(this.adjustmentQuantity);
        if (!qty || qty < 1) {
            this.alertService.showError('Ingresa cantidad válida');
            return null;
        }
        return qty;
    }

    private emitAdjustment(quantity: number, type: 'in' | 'out', feedback: string) {
        this.adjustInventory.emit({
            product_id: this.product.id,
            movement_type: type,
            quantity,
        });
        this.alertService.showSuccess(feedback);
        this.adjustmentQuantity = 0;
    }

    get isInactive(): boolean {
        return this.inventory === 0;
    }

    get imageUrl(): string {
        return this.product.product_image || '/assets/placeholder.png';
    }
}