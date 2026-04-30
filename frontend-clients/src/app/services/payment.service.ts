import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private stripePromise = loadStripe(environment.stripePublishableKey);

  constructor(private http: HttpClient) {}

  /**
   * Redirects the user to Stripe's payment page using the clientSecret.
   * Saves orderId to localStorage so PaymentResult can use it after redirect.
   */
async checkout(orderId: number, amount: number, currency: string, userId: number): Promise<void> {
    localStorage.setItem('pendingOrderId', orderId.toString());
    const token = localStorage.getItem('auth_token');
    const response = await firstValueFrom(
        this.http.post<{ url: string }>(
            `${environment.apiUrl}/payments/checkout-session`,
            { orderId, amount, currency, userId },
            { headers: { Authorization: `Bearer ${token}` } } 
        )
    );

    window.location.href = response.url!;
}
confirmPayment(sessionId: string, orderId: number) {
  const token = localStorage.getItem('auth_token');
  return firstValueFrom(
    this.http.post(
      `${environment.apiUrl}/payments/confirm-session`,
      { sessionId, orderId },
      { headers: { Authorization: `Bearer ${token}` } }
    )
  );
}
}