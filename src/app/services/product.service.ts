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
  // Dériver baseUrl de apiUrl au lieu de coder en dur
  private readonly baseUrl = environment.ApiUrl.replace('/api', '');

  constructor(private http: HttpClient) {
    console.log('ProductService initialized');
    console.log('API URL:', this.apiUrl);
    console.log('Base URL:', this.baseUrl);
  }

  // Getter pour accéder à l'apiUrl depuis le composant
  get baseApiUrl(): string {
    return this.apiUrl;
  }

  // Méthode pour construire l'URL complète des images
  getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return 'assets/images/placeholder.svg'; // Utilisez .svg
  }

    // Cas 2: C'est déjà une URL complète (retournée par l'API dans imageUrl)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      console.log('Using full URL:', imagePath);
      return imagePath;
    }

    // Cas 3: C'est un chemin relatif (ex: "images/filename.jpg")
    const cleanPath = imagePath.replace(/^\/+/, '');
    const fullUrl = `${this.baseUrl}/storage/${cleanPath}`;
    console.log('Constructed URL:', fullUrl);
    return fullUrl;
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

    formData.append('name', product.name || '');
    formData.append('price', (product.price || 0).toString());
    formData.append('stock_quantity', (product.stock_quantity || 0).toString());
    formData.append('category_id', (product.category_id || 0).toString());
    formData.append('description', product.description || '');
    formData.append('allergens', product.allergens || '');

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