import { Product } from './product';
import { Pack } from './pack';

export interface Cart {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  items?: CartItem[];
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id?: number;
  pack_id?: number;
  item_type: 'product' | 'pack';
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
  pack?: Pack;
  // Ces propriétés sont calculées côté frontend ou API
  unit_price?: number;
  total_price?: number;
}

export interface CartResponse {
  items: CartItem[];
  total_amount: number;
  total_items: number;
}

export interface AddProductToCartRequest {
  product_id: number;
  quantity?: number;
}

export interface AddPackToCartRequest {
  pack_id: number;
  quantity?: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
