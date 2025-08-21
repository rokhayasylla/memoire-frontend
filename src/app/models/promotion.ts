import { Product } from "./product";

export interface Promotion {
  id: number;
  name: string;
  description?: string;
  discount_percentage?: number;
  discount_amount?: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  products?: Product[];
}

export interface CreatePromotionRequest {
  name: string;
  description?: string;
  discount_percentage?: number | null;
  discount_amount?: number | null;
  start_date: string;
  end_date: string;
  is_active?: boolean;
  product_ids: number[];
}

export interface UpdatePromotionRequest {
  name?: string;
  description?: string;
  discount_percentage?: number | null;
  discount_amount?: number | null;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  product_ids?: number[];
}
