import { IInventory, IProduct } from "../interfaces";

export interface ICreateInventoryDTO {
  product_id: number;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  moved_at?: Date;
}

export interface IUpdateInventoryDTO {
  id: number;
  product_id?: number;
  movement_type?: 'in' | 'out' | 'adjustment';
  quantity?: number;
  moved_at?: Date;
}

export interface IInventoryResponseDTO extends Omit<IInventory, 'product_id'> {
  product: Omit<IProduct, 'store_id' | 'created_at' | 'updated_at'>;
}