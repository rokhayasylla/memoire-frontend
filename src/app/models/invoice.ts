import { Order } from './order';

export interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  amount: number;
  pdf_path?: string;
  sent_by_email: boolean;
  created_at: string;
  updated_at: string;
  order?: Order;
}

export interface CreateInvoiceRequest {
  order_id: number;
}
