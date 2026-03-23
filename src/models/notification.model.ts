// =========================================================
// Notification models
// Defines the shape of the request bodies received from Orders
// =========================================================

export interface OrderItem {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface OrderComplete {
  id: number;
  total: number;
  status: string;
  created_at: string;
  customer: {
    first_name: string;
    paternal_last_name: string;
    email: string;
  };
  store: {
    name: string;
    email: string;
  };
  items: OrderItem[];
}

// ---- Request body DTOs ----

export interface OrderConfirmedDTO {
  order_id: number;
  customer_email: string;
  otp: string;
  order: OrderComplete;
}

export interface OrderStatusUpdatedDTO {
  order_id: number;
  customer_email: string;
  status: string;
  order: OrderComplete;
}

export interface OrderCancelledByStoreDTO {
  order_id: number;
  customer_email: string;
  order: OrderComplete;
}

export interface OrderCancelledByPaymentDTO {
  order_id: number;
  customer_email: string;
  order: OrderComplete;
}