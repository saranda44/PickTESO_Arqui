import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService, Order } from '../../services/orders.service';
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
    private ordersService: OrdersService,
    private cartService: CartService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.cartCount = this.cartService.count;
    console.log('token at ngOnInit:', this.auth.getToken());

    this.ordersService.getOrdersByUser().subscribe({
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