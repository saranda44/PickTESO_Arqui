import { Injectable } from '@angular/core';
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

  constructor(private http: HttpClient, private router: Router) { }

  login(credentials: { email: string; password: string }) {
    return this.http.post(`${environment.apiGatewayApiUrl}/auth/login`, credentials).pipe(
      tap((response: any) => {
        this.setToken(response.token);
      })
    );
  }

  setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_ID, '1'); // Simulación de asignación de userId
    localStorage.setItem(this.STORE_ID, '1'); // Simulación de asignación de store_id
    this.router.navigate(['/home']);
  }

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn() {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ID);
    localStorage.removeItem(this.STORE_ID);
    localStorage.clear();
    this.router.navigate(['/']);
  }
}