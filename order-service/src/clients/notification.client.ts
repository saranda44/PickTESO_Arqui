// Notification Service
// Used by Orders to send email notifications to customers and store admins when orders are created, updated, or cancelled
import axios from "axios";

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL;


// Fire and forget helper
// Sends the request without awaiting — logs errors silently
function fireAndForget(endpoint: string, body: object): void {
  axios
    .post(endpoint, body)
    .catch((error) => {
      console.error(
        `[notifications.client] Failed to send notification at ${endpoint}:`,
        error?.response?.data ?? error?.message
      );
    });
}

// Order confirmed — sent to customer
// Triggered when payment succeeds (pending → paid)
// Includes OTP for order pickup
export function notifyOrderConfirmed(
  orderId: number,
  customerEmail: string,
  storeEmail: string,
  otp: string,
  order: any
): void {
  fireAndForget(`${NOTIFICATIONS_SERVICE_URL}/notifications/order-confirmed`, {
    order_id:       orderId,
    customer_email: customerEmail,
    store_email: storeEmail,
    otp,
    order
  });
}
 
// Order status updated — sent only to customer
// Triggered when store_admin changes status (except cancelled/completed)
export function notifyOrderStatusUpdated(
  orderId: number,
  customerEmail: string,
  newStatus: string,
  order: any
): void {
  fireAndForget(`${NOTIFICATIONS_SERVICE_URL}/notifications/order-status-updated`, {
    order_id:       orderId,
    customer_email: customerEmail,
    status:         newStatus,
    order
  });
}
 
// Order cancelled by store — sent to customer
// Includes refund notice
export function notifyOrderCancelledByStore(
  orderId: number,
  customerEmail: string,
  order: any
): void {
  fireAndForget(`${NOTIFICATIONS_SERVICE_URL}/notifications/order-cancelled-by-store`, {
    order_id:       orderId,
    customer_email: customerEmail,
    order
  });
}
 
// Order cancelled by payment failure — sent to customer
// Tells customer payment failed and to retry
export function notifyOrderCancelledByPayment(
  orderId: number,
  customerEmail: string,
  order: any
): void {
  fireAndForget(`${NOTIFICATIONS_SERVICE_URL}/notifications/order-cancelled-by-payment`, {
    order_id:       orderId,
    customer_email: customerEmail,
  });
}