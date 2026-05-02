import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CartService } from '../../services/cart.service';
import { AuthService, AuthUser } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {

  user = signal<AuthUser | null>(null);
  cartCount!: () => number;

  constructor(
    private userService: UserService,
    private cartService: CartService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.cartCount = this.cartService.count;

    this.userService.getUserInfo().then((data) => {
      this.user.set(data);
    }).catch((err) => {
      console.error('ERROR:', err);
    });
  }

  getInitials(name: string): string {
  return name?.charAt(0)?.toUpperCase() ?? '?';
  }

  logout(): void {
  this.auth.logout();
}
}