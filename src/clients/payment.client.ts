// Payments Service
// Used by Orders to request refunds when a store cancels a paid order
import axios from 'axios';

const PAYMENTS_SERVICE_URL = process.env.PAYMENTS_SERVICE_URL;

type PaymentIntentResponse = {
  client_secret: string;
};

function getErrorDetails(error: unknown): string {
  if (error && typeof error === 'object') {
    const maybeResponse = (error as { response?: { data?: unknown } }).response;
    if (maybeResponse?.data !== undefined) {
      return typeof maybeResponse.data === 'string'
        ? maybeResponse.data
        : JSON.stringify(maybeResponse.data);
    }

    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }
  }

  return 'Unknown error';
}


// Request a refund for a paid order 
// Called when store_admin cancels an order that was already paid
export function requestRefund(orderId: number): void {
  const endpoint = `${PAYMENTS_SERVICE_URL}/payments/${orderId}/refund`;

  axios
    .post(endpoint, {})
    .catch((error: unknown) => {
      // Log but don't throw — refund is handled async by payments service
      console.error(
        `[payments.client] Failed to request refund for order ${orderId}:`,
        getErrorDetails(error)
      );
    });
}

// Create payment intent for an order
// Called by Orders when a new order is created and needs to be paid
export async function createPaymentIntent(orderId: number, amount: number, currency: string = 'mxn'): Promise<string> {
  const endpoint = `${PAYMENTS_SERVICE_URL}/api/payments/create-payment-intent`;

  try {
    const response = await axios.post<PaymentIntentResponse>(endpoint, { orderId, amount, currency });
    return response.data.client_secret;
  } catch (error: unknown) {
    console.error(
      `[payments.client] Failed to create payment intent for order ${orderId}:`,
      getErrorDetails(error)
    );
    throw error;
  }
}