import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Order } from '../../models/order';
import { OrderService } from '../../services/order.service';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

@Component({
  selector: 'app-employee-layout',
  templateUrl: './employee-layout.component.html',
  styleUrls: ['./employee-layout.component.css']
})
export class EmployeeLayoutComponent implements OnInit {
  currentUser: any = null;
  isLoading = true;
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loadingOrders = false;

  statusFilter: string = 'all';
  searchTerm: string = '';
  stats: any = {
    pending: 0,
    preparing: 0,
    ready: 0,
    delivering: 0,
    delivered: 0,
    cancelled: 0
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private orderService: OrderService
  ) {}

  /**
   * Initialise le composant au démarrage
   * Vérifie l'authentification, valide le rôle utilisateur et charge les commandes
   */
  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        if (user && user.role !== 'employee') {
          this.router.navigate(['/login']);
        } else {
          this.isLoading = false;
          this.loadOrders();
        }
      });
    } else {
      this.router.navigate(['/login']);
    }
    // ✅ Supprimé le double appel à loadOrders()
  }

  /**
   * Charge toutes les commandes depuis le service
   * Met à jour les statistiques et applique les filtres après chargement
   */
  loadOrders(): void {
    this.loadingOrders = true;
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.updateStats();
        this.filterOrders();
        this.loadingOrders = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des commandes:', err);
        this.loadingOrders = false;
      }
    });
  }

  /**
   * Met à jour les statistiques de comptage par statut
   * Calcule le nombre de commandes pour chaque statut disponible
   */
  updateStats(): void {
    this.stats = {
      pending: this.orders.filter(o => o.status === 'pending').length,
      preparing: this.orders.filter(o => o.status === 'preparing').length,
      ready: this.orders.filter(o => o.status === 'ready').length,
      delivering: this.orders.filter(o => o.status === 'delivering').length,
      delivered: this.orders.filter(o => o.status === 'delivered').length,
      cancelled: this.orders.filter(o => o.status === 'cancelled').length
    };
  }

  /**
   * Met à jour le statut d'une commande spécifique
   * Actualise les statistiques et les filtres après mise à jour
   * @param order - La commande à mettre à jour
   * @param newStatus - Le nouveau statut à appliquer
   */
  updateStatus(order: Order, newStatus: OrderStatus): void {
    const statusData = { status: newStatus }; 
    this.orderService.updateOrderStatus(order.id, statusData).subscribe({
      next: (updated) => {
        order.status = updated.status;
        this.updateStats();
        this.filterOrders();
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du statut:', err);
      }
    });
  }

  /**
   * Retourne le libellé français correspondant au statut de commande
   * @param status - Le statut de la commande en anglais
   * @returns Le libellé en français du statut
   */
  getOrderStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pending: 'En attente',
      preparing: 'En préparation',
      ready: 'Prêt',
      delivering: 'En livraison',
      delivered: 'Livré',
      cancelled: 'Annulé'
    };
    return labels[status] || status;
  }

  /**
   * Gestionnaire d'événement pour le changement de filtre de statut
   * Réapplique les filtres sur les commandes
   */
  onStatusFilterChange(): void {
    this.filterOrders();
  }

  /**
   * Gestionnaire d'événement pour le changement du terme de recherche
   * Réapplique les filtres sur les commandes
   */
  onSearchChange(): void {
    this.filterOrders();
  }

  /**
   * Filtre les commandes selon le statut sélectionné et le terme de recherche
   * Applique une recherche sur le nom du client et l'ID de commande
   */
  filterOrders(): void {
    this.filteredOrders = this.orders.filter(order => {
      const matchesStatus =
        this.statusFilter === 'all' || order.status === this.statusFilter;

      const matchesSearch =
        this.searchTerm === '' ||
        (order.user?.full_name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
         order.id.toString().includes(this.searchTerm));

      return matchesStatus && matchesSearch;
    });
  }

  /**
   * Compte le nombre de commandes créées aujourd'hui
   * @returns Le nombre de commandes du jour
   */
  getTodayOrdersCount(): number {
    const today = new Date().toDateString();
    return this.orders.filter(order => 
      new Date(order.created_at).toDateString() === today
    ).length;
  }

  /**
   * Remet à zéro tous les filtres appliqués
   * Rétablit l'affichage de toutes les commandes
   */
  clearFilters(): void {
    this.statusFilter = 'all';
    this.searchTerm = '';
    this.filterOrders();
  }

  /**
   * Fait défiler la page vers le haut avec une animation douce
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Déconnecte l'utilisateur actuel
   * Redirige vers la page de connexion après déconnexion
   */
  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  // ✅ Menu corrigé - suppression des routes
  /**
   * Configuration des éléments du menu de navigation
   * Contient les onglets disponibles pour l'interface employé
   */
  menuItems = [
    { key: 'orders', label: 'Commandes', icon: 'fas fa-shopping-cart' },
    { key: 'deliveries', label: 'Livraisons', icon: 'fas fa-truck' },
    { key: 'support', label: 'Support', icon: 'fas fa-headset' }
  ];

  /**
   * Onglet actuellement actif dans l'interface
   */
  activeTab = 'orders';

  /**
   * Change l'onglet actif dans l'interface employé
   * @param key - La clé de l'onglet à activer
   */
  setActiveTab(key: string): void {
    console.log('Changement d\'onglet vers:', key); // Pour déboguer
    this.activeTab = key;
  }

  /**
   * Retourne la classe CSS appropriée pour un élément de menu
   * Applique un style différent pour l'élément actif
   * @param key - La clé de l'élément de menu
   * @returns La classe CSS à appliquer
   */
  getMenuItemClass(key: string): string {
    return this.activeTab === key
      ? 'bg-orange-50 text-orange-600 border-r-4 border-orange-600'
      : 'text-gray-700 hover:text-orange-600';
  }

  /**
   * Retourne le sous-titre correspondant à l'onglet actif
   * @returns Le texte de description de l'onglet actuel
   */
  getActiveTabSubtitle(): string {
    const subtitles: { [key: string]: string } = {
      orders: 'Gérez les commandes en cours',
      deliveries: 'Suivez les livraisons en temps réel',
      support: 'Répondez aux demandes clients'
    };
    return subtitles[this.activeTab] || '';
  }

  /**
   * Retourne le titre principal correspondant à l'onglet actif
   * @returns Le titre de la section courante
   */
  getActiveTabTitle(): string {
    switch (this.activeTab) {
      case 'orders': return 'Gestion des commandes';
      case 'deliveries': return 'Gestion des livraisons';
      case 'support': return 'Support client';
      default: return 'Tableau de bord';
    }
  }
}