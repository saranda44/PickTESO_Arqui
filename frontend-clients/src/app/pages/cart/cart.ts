import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { RouterModule } from '@angular/router';

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

  constructor(private cartService: CartService) {
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
}