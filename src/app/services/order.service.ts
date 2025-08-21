import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {CreateOrderRequest, Order, UpdateOrderStatusRequest} from "../models/order";

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = environment.ApiUrl;

  constructor(private http: HttpClient) {}

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`);
  }

  createOrder(order: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, order);
  }

  updateOrderStatus(id: number, statusData: UpdateOrderStatusRequest): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/orders/${id}/status`, statusData);
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/my-orders`);
  }

  getOrdersByStatus(status: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/status/${status}`);
  }
}
