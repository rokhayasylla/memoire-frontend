import { OrderItem } from './orderitem';
import { User } from './user';

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  total_amount: number;
  discount_amount: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  payment_method: 'cash_on_delivery' | 'online';
  payment_status: 'pending' | 'paid' | 'failed';
  delivery_address: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  order_items?: OrderItem[];   // Changé de orderItems à order_items pour correspondre à l'API
  orderItems?: OrderItem[];    // Garder aussi orderItems pour la compatibilité
  invoice?: Invoice;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  amount: number;
  pdf_path?: string;
  sent_by_email: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  payment_method: 'cash_on_delivery' | 'online';
  delivery_address: string;
  notes?: string;
  items: {
    product_id: number;
    quantity: number;
  }[];
}

export interface UpdateOrderStatusRequest {
  status: 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
}
