import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from "../models/category";

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly apiUrl = environment.ApiUrl; // Correction: ApiUrl au lieu de apiUrl

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}`);
  }

  createCategory(category: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, category);
  }

  updateCategory(id: number, category: UpdateCategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }
}
