// admin-layout.component.ts
import { Component, OnInit } from '@angular/core';
import { User } from "../../models/user";
import { AuthService } from "../../services/auth.service";
import { Router } from "@angular/router";
import { DashboardService, DashboardStats } from "../../services/dashboard.service";

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit {
  currentUser: User | null = null;
  activeTab = 'dashboard';
  isLoading = true;
  dashboardStats: DashboardStats | null = null;
  loadingStats = false;

  menuItems = [
    { key: 'dashboard', label: 'Tableau de bord', icon: 'fas fa-tachometer-alt' },
    { key: 'users', label: 'Utilisateurs', icon: 'fas fa-users' },
    { key: 'products', label: 'Produits & Catégories', icon: 'fas fa-box' },
    { key: 'packs', label: 'Packs', icon: 'fas fa-cubes' },
    { key: 'promotions', label: 'Promotions', icon: 'fas fa-tags' },
    { key: 'orders', label: 'Commandes', icon: 'fas fa-shopping-cart' },
    { key: 'statistics', label: 'Statistiques', icon: 'fas fa-chart-bar' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Vérifier si l'utilisateur est déjà authentifié
      if (this.authService.isAuthenticated()) {
        // S'abonner aux changements d'utilisateur
        this.authService.currentUser$.subscribe(user => {
          this.currentUser = user;
          if (user && user.role !== 'admin') {
            this.router.navigate(['/login']);
          } else if (user && user.role === 'admin') {
            this.isLoading = false;
            // Charger les statistiques du dashboard
            this.loadDashboardStats();
          }
        });

        // Si pas d'utilisateur dans le BehaviorSubject, récupérer les infos utilisateur
        if (!this.currentUser) {
          this.authService.getCurrentUser().subscribe({
            next: (user) => {
              // L'utilisateur sera mis à jour via le BehaviorSubject
            },
            error: () => {
              this.router.navigate(['/login']);
            }
          });
        }
      } else {
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      this.router.navigate(['/login']);
    }
  }

  loadDashboardStats(): void {
    this.loadingStats = true;
    this.dashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
        this.loadingStats = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.loadingStats = false;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;

    // Recharger les stats quand on revient sur le dashboard
    if (tab === 'dashboard' && this.currentUser?.role === 'admin') {
      this.loadDashboardStats();
    }
  }

  getMenuItemClass(key: string): string {
    return this.activeTab === key
      ? 'bg-orange-50 text-orange-600 border-r-4 border-orange-600'
      : 'text-gray-700 hover:text-orange-600';
  }

  getActiveTabTitle(): string {
    const activeItem = this.menuItems.find(item => item.key === this.activeTab);
    return activeItem?.label || 'Tableau de bord';
  }

  getActiveTabDescription(): string {
    const descriptions: { [key: string]: string } = {
      dashboard: 'Vue d\'ensemble de votre boulangerie',
      users: 'Gestion des utilisateurs et des rôles',
      products: 'Gestion des produits et catégories',
      packs: 'Gestion des packs disponibles',
      promotions: 'Gestion des offres et promotions',
      orders: 'Suivi et gestion des commandes',
      statistics: 'Analyses et rapports détaillés'
    };
    return descriptions[this.activeTab] || '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getStockStatusClass(quantity: number): string {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity <= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  getOrderStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'preparing': 'bg-blue-100 text-blue-800',
      'ready': 'bg-green-100 text-green-800',
      'delivering': 'bg-orange-100 text-orange-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getOrderStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'En attente',
      'preparing': 'En préparation',
      'ready': 'Prêt',
      'delivering': 'En livraison',
      'delivered': 'Livré',
      'cancelled': 'Annulé'
    };
    return statusLabels[status] || status;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // La navigation est gérée dans le service
      },
      error: (error) => {
        console.error('Erreur lors de la déconnexion:', error);
        // Forcer la déconnexion locale même en cas d'erreur
        this.authService.removeToken();
        this.router.navigate(['/login']);
      }
    });
  }
}
