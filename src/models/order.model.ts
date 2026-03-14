export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Order {
  id: number;
  user_id: number;
  store_id: number;
  total: number;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
}

export interface OrderProduct {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

//---- DTOs (Data Transfer Objects) ----

export interface CreateOrderItemDTO {
  product_id: number;
  quantity: number;
}

export interface CreateOrderDTO {
  store_id: number;
  items: CreateOrderItemDTO[];
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
}

//---- Response ----
export interface OrderWithProducts extends Order {
  items: OrderProduct[];
}