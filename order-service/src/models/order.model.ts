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
  items: CreateOrderItemDTO[];
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
}

// ---- Response shapes ----
 
export interface OrderCustomer {
  id: number;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  email: string;
}
 
export interface OrderStore {
  id: number;
  name: string;
  email: string;  // store admin email
}
 
export interface OrderProductDetail extends OrderProduct {
  name: string;   // product name from products table
}
 
export interface OrderWithProducts extends Order {
  customer: OrderCustomer;
  store: OrderStore;
  items: OrderProductDetail[];
}

export interface OrderWithItems extends Order {
  items: OrderProduct[];
}

export interface CreateOrderResult {
  order: OrderWithItems;
  client_secret: string;
}
