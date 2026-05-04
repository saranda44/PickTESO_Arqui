import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

interface LoginResponse {
  token: string;
  userId?: string;
  storeId?: string;
  role?: string;
}

interface StorageKeys {
  token: string;
  userId: string;
  storeId: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEYS: StorageKeys = {
    token: 'token',
    userId: 'userId',
    storeId: 'store_id',
    role: 'role',
  };

  isLoggedIn = signal(this.hasToken());

  constructor(private http: HttpClient, private router: Router) { }

  login(credentials: { email: string; password: string }) {
    return this.http
      .post<LoginResponse>(`${environment.apiGatewayApiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          this.setToken(response.token, response.userId, response.storeId, response.role);
        })
      );
  }

  setToken(token: string, userId?: string | null, storeId?: string | null, role?: string | null) {
    this.setItem(this.STORAGE_KEYS.token, token);
    if (userId) this.setItem(this.STORAGE_KEYS.userId, userId);
    if (storeId) this.setItem(this.STORAGE_KEYS.storeId, storeId);
    if (role) this.setItem(this.STORAGE_KEYS.role, role);
    this.isLoggedIn.set(true);
    this.router.navigate(['/home']);
  }

  getToken() {
    return this.getItem(this.STORAGE_KEYS.token);
  }

  getUserId() {
    return this.getItem(this.STORAGE_KEYS.userId);
  }

  getStoreId() {
    return this.getItem(this.STORAGE_KEYS.storeId);
  }

  getUserRole() {
    return this.getItem(this.STORAGE_KEYS.role);
  }

  logout() {
    Object.values(this.STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.STORAGE_KEYS.token);
  }

  private getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  private setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }
}
