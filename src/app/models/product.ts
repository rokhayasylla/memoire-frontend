import {Category} from "./category";

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  image: string;
  imageUrl?: string; 
  allergens?: string;
  category_id: number;
  category?: Category;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  image: File;
  allergens?: string;
  category_id: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stock_quantity?: number;
  image?: File;
  allergens?: string;
  category_id?: number;
}
