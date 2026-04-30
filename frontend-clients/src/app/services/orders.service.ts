import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {

  private apiUrl = 'http://localhost:3000/api/orders/user/orders';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  getOrdersByUser(): Observable<{ orders: Order[] }> {
  const token = this.auth.getToken();

  return this.http.get<{ orders: Order[] }>(this.apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

  getProductsByIds(ids: number[]): Observable<{ products: any[] }> {
  return this.http.get<{ products: any[] }>(
    `http://localhost:3000/api/catalog/products/by-ids?ids=${ids.join(',')}`,
    { headers: { Authorization: `Bearer ${this.auth.getToken()}` } }
  );
}

}