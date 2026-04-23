import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {

  auth = inject(AuthService);
  menuOpen = signal(false);

  get isLoggedIn() {
    return this.auth.isLoggedIn;
  }

  toggleMenu() {
    this.menuOpen.set(!this.menuOpen());
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  logout() {
    this.auth.logout();
    this.closeMenu();
  }
}