import { Product } from './product';
import { Pack } from './pack';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id?: number;
  pack_id?: number;
  item_type: 'product' | 'pack';
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
  product?: Product;
  pack?: Pack;
}
