import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../../services/orders';
import { AuthService } from '../../../services/auth';
import { IOrder } from '../../../interfaces/order.interface';
import { OrderItem } from './order-item/order-item';
import { AlertService } from '../../../services/alert';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, OrderItem],
  templateUrl: './orders-list.html',
  styleUrl: './orders-list.scss',
})
export class OrdersList implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly auth = inject(AuthService);
  private readonly alert = inject(AlertService);

  readonly orders = signal<IOrder[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    const raw = this.auth.getStoreId();
    const storeId = raw ? Number(raw) : null;
    if (!storeId) {
      this.alert.showError('No se encontró la tienda asignada');
      return;
    }

    this.loading.set(true);
    this.ordersService.getOrdersByStore(storeId).subscribe({
      next: (res) => {
        this.orders.set(res.orders);
        this.loading.set(false);
      },
      error: () => {
        this.alert.showError('Error al cargar los pedidos');
        this.loading.set(false);
      },
    });
  }
}