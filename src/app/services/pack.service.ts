import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pack, CreatePackRequest, UpdatePackRequest } from '../models/pack';

@Injectable({
  providedIn: 'root'
})
export class PackService {
  readonly apiUrl = environment.ApiUrl;

  constructor(private http: HttpClient) {}

  // Getter pour accéder à l'apiUrl depuis le composant
  get baseApiUrl(): string {
    return this.apiUrl;
  }

  getPacks(): Observable<Pack[]> {
    return this.http.get<Pack[]>(`${this.apiUrl}/packs`);
  }

  getPack(id: number): Observable<Pack> {
    return this.http.get<Pack>(`${this.apiUrl}/packs/${id}`);
  }

  getActivePacks(): Observable<Pack[]> {
    return this.http.get<Pack[]>(`${this.apiUrl}/packs-active`);
  }

  createPack(pack: CreatePackRequest): Observable<Pack> {
    const formData = new FormData();
    formData.append('name', pack.name);
    formData.append('price', pack.price.toString());

    if (pack.description) {
      formData.append('description', pack.description);
    }

    if (pack.image_path) {
      formData.append('image_path', pack.image_path);
    }

    if (pack.is_active !== undefined) {
      // Convertir en 1 ou 0 pour Laravel
      formData.append('is_active', pack.is_active ? '1' : '0');
    }

    // Ajouter les produits
    pack.products.forEach((product, index) => {
      formData.append(`products[${index}][product_id]`, product.product_id.toString());
      formData.append(`products[${index}][quantity]`, product.quantity.toString());
    });

    return this.http.post<Pack>(`${this.apiUrl}/packs`, formData);
  }

  updatePack(id: number, pack: UpdatePackRequest): Observable<Pack> {
    const formData = new FormData();

    if (pack.name) {
      formData.append('name', pack.name);
    }

    if (pack.price !== undefined) {
      formData.append('price', pack.price.toString());
    }

    if (pack.description !== undefined) {
      formData.append('description', pack.description);
    }

    if (pack.image) {
      formData.append('image', pack.image);
    }

    if (pack.is_active !== undefined) {
      // CORRECTION: Convertir en 1 ou 0 au lieu de "true"/"false"
      formData.append('is_active', pack.is_active ? '1' : '0');
    }

    // Ajouter les produits si fournis
    if (pack.products) {
      pack.products.forEach((product, index) => {
        formData.append(`products[${index}][product_id]`, product.product_id.toString());
        formData.append(`products[${index}][quantity]`, product.quantity.toString());
      });
    }

    // Pour Laravel, on doit simuler une requête PUT avec _method
    formData.append('_method', 'PUT');

    return this.http.post<Pack>(`${this.apiUrl}/packs/${id}`, formData);
  }

  // Méthode spécifique pour mettre à jour uniquement le statut
  updatePackStatus(id: number, isActive: boolean): Observable<Pack> {
    const formData = new FormData();
    formData.append('is_active', isActive ? '1' : '0');
    formData.append('_method', 'PUT');

    return this.http.post<Pack>(`${this.apiUrl}/packs/${id}`, formData);
  }

  deletePack(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/packs/${id}`);
  }
}
