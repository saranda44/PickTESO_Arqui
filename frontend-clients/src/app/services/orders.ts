import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface OrderItem {
  product_id: number;
  quantity: number;
}

export interface Order {
  id: number;
  user_id: number;
  store_id: number;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
  items: any[];
}

export interface CreateOrderResponse {
  order: Order;
  client_secret: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  createOrder(storeId: number, items: OrderItem[]): Promise<CreateOrderResponse> {
    return firstValueFrom(
      this.http.post<CreateOrderResponse>(
        `${this.apiUrl}/api/orders/user/stores/${storeId}/orders`,
        { items },
        { headers: this.headers }
      )
    );
  }

  getMyOrders(): Promise<{ orders: Order[] }> {
    return firstValueFrom(
      this.http.get<{ orders: Order[] }>(
        `${this.apiUrl}/api/orders/user/orders`,
        { headers: this.headers }
      )
    );
  }

  getOrderById(orderId: number): Promise<{ order: Order }> {
    return firstValueFrom(
      this.http.get<{ order: Order }>(
        `${this.apiUrl}/api/orders/user/orders/${orderId}`,
        { headers: this.headers }
      )
    );
  }
}
