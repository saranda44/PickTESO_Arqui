import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, Order } from '../../services/orders.service';
import { CartService } from '../../services/cart.service';
import { RouterModule } from '@angular/router';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.html',
  styleUrls: ['./orders.scss'],
})
export class Orders implements OnInit {

  orders = signal<Order[]>([]);
  cartCount!: () => number;
  loading = signal(false);
  errorMessage = '';

  constructor(
    private ordersService: OrderService,
    private cartService: CartService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.cartCount = this.cartService.count;

    this.ordersService.getMyOrders().subscribe({
      next: (data) => {
        this.orders.set(data.orders);
      },
      error: (err) => {
        console.error('Error loading orders:', err);
      }
    });
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'processing': 'Procesando',
      'completed': 'Completada',
      'delivered': 'Entregada',
      'cancelled': 'Cancelada',
      'paid': 'Pagada'
    };
    return statusMap[status.toLowerCase()] || status;
  }

  async pay(order: Order): Promise<void> {
    const userId = Number(localStorage.getItem('id'));
    this.loading.set(true);
    this.errorMessage = '';

    try {
      await this.paymentService.checkout(
        Number(order.id),
        Math.round(parseFloat(order.total) * 100),
        'mxn',
        userId
      );
    } catch (err: any) {
      console.error('Payment error:', err);
      this.errorMessage = err?.error?.message ?? err?.message ?? 'Error al procesar el pago';
      this.loading.set(false);
    }
  }
}