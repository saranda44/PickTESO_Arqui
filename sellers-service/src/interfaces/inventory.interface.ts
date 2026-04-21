export interface IInventory {
  id: number;
  product_id: number;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  moved_at?: Date;
  created_at: Date;
  updated_at: Date;
}