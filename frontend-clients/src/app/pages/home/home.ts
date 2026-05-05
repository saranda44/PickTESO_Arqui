import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { StoreService, Store } from '../../services/store.service';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/orders.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {

  restaurants = signal<Store[]>([]);

  cartCount!: () => number;

  constructor(
    private storeService: StoreService,
    private router: Router,
    private cartService: CartService,
    private orderService: OrderService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.cartCount = this.cartService.count;

    this.storeService.getStores().subscribe({
      next: (data) => {
        this.restaurants.set(data);
      },
      error: (err) => console.error('Error loading stores:', err)
    });

    this.orderService.getMyOrders().subscribe({
      next: (data) => {
        // Orders loaded
      },
      error: (err) => console.error('Error loading orders:', err)
    });

    this.userService.getUserInfo().catch((err: any) => console.error('Error loading user info:', err));
  }

  goToStore(id: number): void {
    this.router.navigate(['/store', id]);
  }
}