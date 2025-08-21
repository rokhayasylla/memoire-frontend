import { Component, OnInit } from '@angular/core';
import { User } from "../../models/user";
import { AuthService } from "../../services/auth.service";
import { Router } from "@angular/router";
import { CartService } from "../../services/cart.service";

@Component({
  selector: 'app-client-layout',
  templateUrl: './client-layout.component.html',
  styleUrl: './client-layout.component.css'
})
export class ClientLayoutComponent implements OnInit {
  currentUser: User | null = null;
  activeTab = 'products';
  cartItemCount = 0;
  showCartModal = false;
  showUserMenu = false;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cartService: CartService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Initialiser l'authentification
      const isAuthenticated = await this.authService.initializeAuth();

      if (!isAuthenticated) {
        this.router.navigate(['/login']);
        return;
      }

      // S'abonner aux changements d'utilisateur
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        if (user && user.role !== 'client') {
          this.router.navigate(['/login']);
        } else if (user) {
          // Charger le panier quand l'utilisateur est connecté
          this.cartService.refreshCart();
        }
        this.isLoading = false;
      });

      // S'abonner aux changements du panier
      this.cartService.cartItemCount$.subscribe(count => {
        this.cartItemCount = count;
      });

    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      this.router.navigate(['/login']);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.showUserMenu = false; // Fermer le menu utilisateur
  }

  getTabClass(tab: string): string {
    return this.activeTab === tab
      ? 'border-orange-500 text-orange-600 bg-orange-50'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  openCartModal(): void {
    this.showCartModal = true;
    this.showUserMenu = false;
  }

  closeCartModal(): void {
    this.showCartModal = false;
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
