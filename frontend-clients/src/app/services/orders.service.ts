import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Para CREAR una orden (lo que envías al backend)
export interface OrderItem {
  product_id: number;
  quantity: number;
}

// Lo que recibes del backend en GET /orders
export interface OrderProduct {
  product_id: number;
  name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  user_id: string;
  store_id: string;
  total: string;
  status: string;
  created_at: string;
  updated_at: string;
  products: OrderProduct[];
}

export interface CreateOrderResponse {
  order: {
    id: string;
    total: string;
  };
  client_secret: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  createOrder(storeId: number, items: OrderItem[]): Promise<CreateOrderResponse> {
    return firstValueFrom(
      this.http.post<CreateOrderResponse>(
        `${this.apiUrl}/orders/user/stores/${storeId}/orders`,
        { items },
        { headers: this.headers }
      )
    );
  }

  getMyOrders(): Observable<{ orders: Order[] }> {
    return this.http.get<{ orders: Order[] }>(
      `${this.apiUrl}/catalog/orders`,
      { headers: this.headers }
    );
  }
}