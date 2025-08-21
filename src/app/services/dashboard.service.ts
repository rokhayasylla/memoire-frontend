// dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import { ProductService } from './product.service';
import { OrderService } from './order.service';
import { Order } from '../models/order';
import { Product } from '../models/product';

export interface DashboardStats {
  usersCount: number;
  productsCount: number;
  ordersCount: number;
  totalRevenue: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
  activePromotions: number;
  activePacks: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = environment.ApiUrl;

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private productService: ProductService,
    private orderService: OrderService
  ) {}

  getDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      users: this.userService.getUsers(),
      products: this.productService.getProducts(),
      orders: this.orderService.getOrders(),
      promotions: this.http.get<any[]>(`${this.apiUrl}/promotions-active`),
      packs: this.http.get<any[]>(`${this.apiUrl}/packs-active`)
    }).pipe(
      map(data => {
        // Calculer le total des revenus (commandes livrées uniquement)
        const totalRevenue = data.orders.reduce((sum, order) => {
          return sum + (order.status === 'delivered' ? order.total_amount : 0);
        }, 0);

        // Récupérer les commandes récentes (5 dernières)
        const recentOrders = data.orders
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        // Produits avec stock faible (stock <= 10)
        const lowStockProducts = data.products.filter(product => product.stock_quantity <= 10);

        return {
          usersCount: data.users.length,
          productsCount: data.products.length,
          ordersCount: data.orders.length,
          totalRevenue,
          recentOrders,
          lowStockProducts,
          activePromotions: data.promotions.length,
          activePacks: data.packs.length
        };
      })
    );
  }
}
