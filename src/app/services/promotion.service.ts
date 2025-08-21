import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {CreatePromotionRequest, Promotion, UpdatePromotionRequest} from "../models/promotion";

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private readonly apiUrl = environment.ApiUrl;

  constructor(private http: HttpClient) {}

  getPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.apiUrl}/promotions`);
  }

  getPromotion(id: number): Observable<Promotion> {
    return this.http.get<Promotion>(`${this.apiUrl}/promotions/${id}`);
  }

  createPromotion(promotion: CreatePromotionRequest): Observable<Promotion> {
    return this.http.post<Promotion>(`${this.apiUrl}/promotions`, promotion);
  }

  updatePromotion(id: number, promotion: UpdatePromotionRequest): Observable<Promotion> {
    return this.http.put<Promotion>(`${this.apiUrl}/promotions/${id}`, promotion);
  }

  deletePromotion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/promotions/${id}`);
  }

  getActivePromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.apiUrl}/promotions-active`);
  }
}
