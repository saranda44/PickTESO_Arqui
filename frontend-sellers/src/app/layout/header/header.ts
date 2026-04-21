import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {

  private auth = inject(AuthService);

  isLoggedIn = computed(() => this.auth.isLoggedIn());

  logout() {
    this.auth.logout();
  }
}