import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private cartService = inject(CartService);
  private router = inject(Router);

  cartCount = this.cartService.count;

  getCurrentRoute(): string {
    return this.router.url.split('/')[1] || 'home';
  }

  isActive(route: string): boolean {
    return this.getCurrentRoute() === route;
  }
}
