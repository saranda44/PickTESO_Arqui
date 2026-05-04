import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  IOrder,
  IOrderWithProducts,
  OrderStatus,
} from '../interfaces/order.interface';
import { AuthService } from './auth';

interface OrdersListResponse {
  orders: IOrder[];
}

interface OrderDetailResponse {
  order: IOrderWithProducts;
}

interface OrderMutationResponse {
  order: IOrder;
  alreadyCancelled?: boolean;
}

interface OrderCompleteResponse {
  data: IOrder;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.ordersApiUrl}`;

  private authHeaders(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'x-user-id': this.auth.getUserId() ?? '',
        'x-user-role': this.auth.getUserRole() ?? '',
      }),
    };
  }

  getOrdersByStore(storeId: number): Observable<OrdersListResponse> {
    return this.http.get<OrdersListResponse>(
      `${this.baseUrl}/stores/${storeId}/orders`,
      this.authHeaders()
    );
  }

  getOrderById(storeId: number, orderId: number): Observable<OrderDetailResponse> {
    return this.http.get<OrderDetailResponse>(
      `${this.baseUrl}/stores/${storeId}/orders/${orderId}`,
      this.authHeaders()
    );
  }

  updateStatus(
    storeId: number,
    orderId: number,
    status: OrderStatus
  ): Observable<OrderMutationResponse> {
    return this.http.patch<OrderMutationResponse>(
      `${this.baseUrl}/stores/${storeId}/orders/${orderId}/status`,
      { status },
      this.authHeaders()
    );
  }

  cancelOrder(storeId: number, orderId: number): Observable<OrderMutationResponse> {
    return this.http.delete<OrderMutationResponse>(
      `${this.baseUrl}/stores/${storeId}/orders/${orderId}/cancel`,
      this.authHeaders()
    );
  }

  completeOrder(
    storeId: number,
    orderId: number,
    otp: string
  ): Observable<OrderCompleteResponse> {
    return this.http.patch<OrderCompleteResponse>(
      `${this.baseUrl}/stores/${storeId}/orders/${orderId}/complete`,
      { otp },
      this.authHeaders()
    );
  }
}