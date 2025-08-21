import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, CreateProductRequest, UpdateProductRequest } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = environment.ApiUrl;

  constructor(private http: HttpClient) {}

  // Getter pour accéder à l'apiUrl depuis le composant
  get baseApiUrl(): string {
    return this.apiUrl;
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(product: CreateProductRequest): Observable<Product> {
    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('price', product.price.toString());
    formData.append('stock_quantity', product.stock_quantity.toString());
    formData.append('category_id', product.category_id.toString());
    formData.append('image', product.image);

    if (product.description) {
      formData.append('description', product.description);
    }
    if (product.allergens) {
      formData.append('allergens', product.allergens);
    }

    return this.http.post<Product>(`${this.apiUrl}/products`, formData);
  }

  updateProduct(id: number, product: UpdateProductRequest): Observable<Product> {
    const formData = new FormData();

    // Ajouter tous les champs, même s'ils sont vides (sauf image)
    formData.append('name', product.name || '');
    formData.append('price', (product.price || 0).toString());
    formData.append('stock_quantity', (product.stock_quantity || 0).toString());
    formData.append('category_id', (product.category_id || 0).toString());
    formData.append('description', product.description || '');
    formData.append('allergens', product.allergens || '');

    // Ajouter l'image seulement si elle est fournie
    if (product.image) {
      formData.append('image', product.image);
    }

    // Pour Laravel, on doit simuler une requête PUT avec _method
    formData.append('_method', 'PUT');

    return this.http.post<Product>(`${this.apiUrl}/products/${id}`, formData);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }

  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/category/${categoryId}`);
  }
}
