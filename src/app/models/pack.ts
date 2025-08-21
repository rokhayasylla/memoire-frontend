import { Product } from './product';

export interface Pack {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_path: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products?: PackProduct[];  // Produits contenus dans le pack
}

export interface PackProduct extends Product {
  pivot: {
    quantity: number;        // Quantité de ce produit dans le pack
  };
}

export interface CreatePackRequest {
  name: string;
  description?: string;
  price: number;
  image_path?: File;
  is_active?: boolean;
  products: {
    product_id: number;
    quantity: number;
  }[];
}

export interface UpdatePackRequest {
  name?: string;
  description?: string;
  price?: number;
  image?: File;
  is_active?: boolean;
  products?: {
    product_id: number;
    quantity: number;
  }[];
}
