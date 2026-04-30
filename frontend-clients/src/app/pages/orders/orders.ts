import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService, Order } from '../../services/orders';
import { CartService } from '../../services/cart.service';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private ordersService: OrderService,
    private cartService: CartService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.cartCount = this.cartService.count;
    console.log('token at ngOnInit:', this.auth.getToken());

    this.ordersService.getMyOrders().subscribe({
      next: (data) => {
        console.log('ORDERS:', JSON.stringify(data, null, 2));
        this.orders.set(data.orders);
      },
      error: (err) => {
        console.error('ERROR:', err);
      }
    });
  }
}