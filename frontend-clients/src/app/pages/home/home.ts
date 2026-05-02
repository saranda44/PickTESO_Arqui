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
    console.log('HOME CARGÓ');

    this.cartCount = this.cartService.count;

    this.storeService.getStores().subscribe({
      next: (data) => {
        console.log('STORES:', data);
        this.restaurants.set(data);
      },
      error: (err) => console.error('ERROR:', err)
    });

    this.orderService.getMyOrders().subscribe({
      next: (data) => {
        console.log('ORDERS:', data);
      },
      error: (err) => console.error('ERROR:', err)
    });

    this.userService.getUserInfo()
      .then((data: any) => {
        console.log('USER INFO:', data);
      })
      .catch((err: any) => console.error('ERROR:', err));
  }

  goToStore(id: number): void {
    this.router.navigate(['/store', id]);
  }
}