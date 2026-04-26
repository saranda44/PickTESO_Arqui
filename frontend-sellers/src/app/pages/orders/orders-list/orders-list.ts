import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../../services/orders';
import { AuthService } from '../../../services/auth';
import { IOrder, OrderStatus, ORDER_STATUS_LABELS } from '../../../interfaces/order.interface';
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
  readonly selectedStatuses = signal<Set<OrderStatus>>(new Set());

  readonly statusOptions: { value: OrderStatus; label: string }[] = [
    { value: 'pending', label: ORDER_STATUS_LABELS.pending },
    { value: 'paid', label: ORDER_STATUS_LABELS.paid },
    { value: 'preparing', label: ORDER_STATUS_LABELS.preparing },
    { value: 'ready', label: ORDER_STATUS_LABELS.ready },
    { value: 'completed', label: ORDER_STATUS_LABELS.completed },
    { value: 'cancelled', label: ORDER_STATUS_LABELS.cancelled },
  ];

  readonly filteredAndSortedOrders = computed(() => {
    const allOrders = this.orders();
    const selected = this.selectedStatuses();

    let filtered = allOrders;
    if (selected.size > 0) {
      filtered = allOrders.filter((order) => selected.has(order.status));
    }

    return filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  toggleStatusFilter(status: OrderStatus): void {
    this.selectedStatuses.update((current) => {
      const updated = new Set(current);
      if (updated.has(status)) {
        updated.delete(status);
      } else {
        updated.add(status);
      }
      return updated;
    });
  }

  isStatusSelected(status: OrderStatus): boolean {
    return this.selectedStatuses().has(status);
  }

  clearFilters(): void {
    this.selectedStatuses.set(new Set());
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