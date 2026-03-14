// Payments Service
// Used by Orders to request refunds when a store cancels a paid order
import axios from 'axios';

const PAYMENTS_SERVICE_URL = process.env.PAYMENTS_SERVICE_URL;


// Request a refund for a paid order 
// Called when store_admin cancels an order that was already paid
export function requestRefund(orderId: number): void {
  const endpoint = `${PAYMENTS_SERVICE_URL}/payments/${orderId}/refund`;

  axios
    .post(endpoint, {})
    .catch((error) => {
      // Log but don't throw — refund is handled async by payments service
      console.error(
        `[payments.client] Failed to request refund for order ${orderId}:`,
        error?.response?.data ?? error?.message
      );
    });
}