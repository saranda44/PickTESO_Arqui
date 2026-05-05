import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  storeId: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly apiUrl = environment.apiUrl;

  currentUser = signal<AuthUser | null>(this.loadUserFromStorage());
  isLoggedIn = signal(this.isAuthenticated());

  constructor(private router: Router) { }

  loginWithGoogle(): void {
    window.location.href = `${this.apiUrl}/auth/google`;
  }

  handleAuthSuccess(token: string, user: AuthUser): void {
    localStorage.setItem(this.TOKEN_KEY, token);

    localStorage.setItem('id', user.id);
    localStorage.setItem('role', user.role);

    this.currentUser.set(user);
    this.isLoggedIn.set(true);

    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.clear();
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  private loadUserFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

}