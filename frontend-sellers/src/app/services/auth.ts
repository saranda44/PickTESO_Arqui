import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environment';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private TOKEN_KEY = 'token';
  private USER_ID = 'userId';
  private STORE_ID = 'store_id';
  private ROLE_KEY = 'role';

  isLoggedIn = signal(!!localStorage.getItem(this.TOKEN_KEY));

  constructor(private http: HttpClient, private router: Router) { }

  login(credentials: { email: string; password: string }) {
    return this.http.post(`${environment.apiGatewayApiUrl}/auth/login`, credentials).pipe(
      tap((response: any) => {
        this.setToken(response.token);
      })
    );
  }

  setToken(token: string, userId?: string | null, storeId?: string | null, role?: string | null) {
    localStorage.setItem(this.TOKEN_KEY, token);
    if (userId) localStorage.setItem(this.USER_ID, userId);
    if (storeId) localStorage.setItem(this.STORE_ID, storeId);
    if (role) localStorage.setItem(this.ROLE_KEY, role);
    this.isLoggedIn.set(true);
    this.router.navigate(['/home']);
  }

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserId() {
    return localStorage.getItem(this.USER_ID);
  }

  getStoreId() {
    return localStorage.getItem(this.STORE_ID);
  }

  getUserRole() {
    return localStorage.getItem(this.ROLE_KEY);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ID);
    localStorage.removeItem(this.STORE_ID);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.clear();
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }
}