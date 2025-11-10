import { OrderItem } from './orderitem';
import { User } from './user';

// Types exportés pour réutilisation
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash_on_delivery' | 'online';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  total_amount: number;
  discount_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  delivery_address: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  livreur_id?: number | null; 
  livreur?: User | null; 
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
  payment_method: PaymentMethod;
  delivery_address: string;
  notes?: string;
  items: {
    product_id: number;
    quantity: number;
  }[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}