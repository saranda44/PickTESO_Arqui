import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/orders';
import { RouterModule } from '@angular/router';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.html',
  styleUrls: ['./cart.scss'],
})
export class Cart {
  items!: any;
  cartCount!: () => number;
  loading = false;
  errorMessage = '';

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private paymentService: PaymentService
  ) {
    this.items = this.cartService.items;
    this.cartCount = this.cartService.count;
  }

  increase(item: any) {
    this.cartService.addToCart(item);
  }

  decrease(item: any) {
    this.cartService.removeFromCart(item.id);
  }

  getTotal(): number {
    return this.cartService.getTotal();
  }

  async checkout(): Promise<void> {
    const storeId = this.cartService.getStoreId();
    if (!storeId) {
      this.errorMessage = 'No se encontró la tienda del carrito';
      return;
    }

    const items = this.cartService.items().map(item => ({
      product_id: Number(item.id),
      quantity: item.quantity,
    }));

    this.loading = true;
    this.errorMessage = '';

    try {
      const result = await this.orderService.createOrder(storeId, items);
      this.cartService.clearCart();
      // Redirect to Stripe ← esto es lo nuevo

      const userId = Number(localStorage.getItem('id'));
      await this.paymentService.checkout(
        result.order.id,
        Math.round(result.order.total * 100), // pesos a centavos
        'mxn',
        userId
      );

    } catch (err: any) {
      console.log(err);
      this.errorMessage = err?.error?.message ?? err?.message ?? 'Error al crear la orden';
    } finally {
      this.loading = false;
    }
  }
}
