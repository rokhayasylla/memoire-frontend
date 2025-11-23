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
  private readonly baseUrl = environment.ApiUrl.replace('/api', '');

  constructor(private http: HttpClient) {
    console.log('ProductService initialized');
    console.log('API URL:', this.apiUrl);
    console.log('Base URL:', this.baseUrl);
  }

  get baseApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Construire l'URL complète de l'image
   * Compatible avec imageUrl (URL complète) ou image (nom de fichier seulement)
   */
  getImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return 'assets/images/placeholder.svg';
    }

    // Si c'est déjà une URL complète (imageUrl du backend), la retourner
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Sinon, construire l'URL à partir du nom de fichier
    // Enlever les slashes au début
    let cleanPath = imagePath.replace(/^\/+/, '');
    
    // Si le chemin ne commence pas par "images/", l'ajouter
    if (!cleanPath.startsWith('images/')) {
      cleanPath = 'images/' + cleanPath;
    }

    // Construire l'URL complète
    const fullUrl = `${this.baseUrl}/storage/${cleanPath}`;
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