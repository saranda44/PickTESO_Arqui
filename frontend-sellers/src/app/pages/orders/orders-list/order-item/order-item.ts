import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IOrder, ORDER_STATUS_LABELS } from '../../../../interfaces/order.interface';

@Component({
  selector: 'app-order-item',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-item.html',
  styleUrl: './order-item.scss',
})
export class OrderItem {
  readonly order = input.required<IOrder>();

  get statusLabel(): string {
    return ORDER_STATUS_LABELS[this.order().status];
  }

  get statusClass(): string {
    return `status status--${this.order().status}`;
  }

  /**
   * El endpoint de lista no devuelve `customer`, así que mostramos el user_id.
   * Cuando el backend enriquezca el listado, reemplazar por nombre completo.
   */
  get customerLabel(): string {
    return `Cliente #${this.order().user_id}`;
  }
}