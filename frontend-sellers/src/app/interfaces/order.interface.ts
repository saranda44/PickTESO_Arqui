export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface IOrder {
  id: number;
  user_id: number;
  store_id: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface IOrderProduct {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface IOrderCustomer {
  id: number;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  email: string;
}

export interface IOrderStore {
  id: number;
  name: string;
  email: string;
}

export interface IOrderProductDetail extends IOrderProduct {
  name: string;
}

export interface IOrderWithProducts extends IOrder {
  customer: IOrderCustomer;
  store: IOrderStore;
  items: IOrderProductDetail[];
}
