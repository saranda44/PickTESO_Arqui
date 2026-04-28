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
  async checkout(clientSecret: string, orderId: number): Promise<void> {
    localStorage.setItem('pendingOrderId', orderId.toString());

    const stripe = await this.stripePromise;
    if (!stripe) throw new Error('Stripe failed to load');

    const { error } = await stripe.confirmPayment({
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/payment/result`,
      },
    });

    if (error) throw new Error(error.message);
  }

  /**
   * Confirms the payment with the backend after Stripe redirects back.
   * Called by PaymentResultComponent with the paymentIntentId from the URL.
   */
  confirmPayment(paymentIntentId: string, orderId: number) {
    return firstValueFrom(
      this.http.post(`${environment.apiUrl}/api/payments/${paymentIntentId}/confirm`, { orderId })
    );
  }
}