import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IOrder, OrderStatus } from '../../../../interfaces/order.interface';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  preparing: 'Preparando',
  ready: 'Listo',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

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
    return STATUS_LABEL[this.order().status];
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