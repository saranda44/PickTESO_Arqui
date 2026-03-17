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
 
// Order confirmed — sent to both customer and store
// Triggered when payment is confirmed (pending → paid) 
export function notifyOrderConfirmed(orderId: number): void {
  fireAndForget(`${NOTIFICATIONS_SERVICE_URL}/notifications/order-confirmed`, {
    order_id: orderId,
  });
}
 

// Order status updated — sent only to customer
// Triggered when store_admin updates the order status
export function notifyOrderStatusUpdated(
  orderId: number,
  newStatus: string
): void {
  fireAndForget(`${NOTIFICATIONS_SERVICE_URL}/notifications/order-status-updated`, {
    order_id: orderId,
    status: newStatus,
  });
}
 
// Order cancelled — sent only to customer
// Triggered when payment fails (pending → cancelled)
export function notifyOrderCancelled(orderId: number): void {
  fireAndForget(`${NOTIFICATIONS_SERVICE_URL}/notifications/order-cancelled`, {
    order_id: orderId,
  });
}
 