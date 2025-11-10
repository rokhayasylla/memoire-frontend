import { Component, OnInit } from '@angular/core';
import { Order } from '../../models/order';
import { OrderService } from '../../services/order.service';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

@Component({
  selector: 'app-employee-deliveries',
  templateUrl: './employee-deliveries.component.html',
  styleUrl: './employee-deliveries.component.css'
})
export class EmployeeDeliveriesComponent implements OnInit {

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = false;
  livreurs: User[] = [];  //  Liste des livreurs
  error: string | null = null;
  selectedOrder: Order | null = null;
  showOrderDetails = false;
  showAssignLivreurModal = false;  // ✅ Modal d'assignation
  selectedLivreurId: number | null = null;  // ✅ Livreur sélectionné
  
  // Filtres
  statusFilter = 'all';
  searchTerm = '';
  
  // Statistiques
  stats = {
    pending: 0,
    preparing: 0,
    ready: 0,
    delivering: 0,
    delivered: 0
  };

  constructor(
    private orderService: OrderService,
    private userService: UserService  // ✅ Injection du UserService
  ) {}

  /**
   * Initialise le composant au démarrage
   * Charge les commandes et démarre le rafraîchissement automatique toutes les 30 secondes
   */
  ngOnInit(): void {
    this.loadOrders();
    this.loadLivreurs();  // ✅ Charger les livreurs
    // Rafraîchissement automatique toutes les 30 secondes
    setInterval(() => {
      this.loadOrders();
    }, 30000);
  }


  // ✅ Charger tous les livreurs
  loadLivreurs(): void {
    this.userService.getLivreurs().subscribe({
      next: (livreurs) => {
        this.livreurs = livreurs;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des livreurs:', error);
      }
    });
  }
   // ✅ Ouvrir le modal d'assignation
  openAssignLivreurModal(order: Order): void {
    this.selectedOrder = order;
    this.selectedLivreurId = order.livreur_id || null;
    this.showAssignLivreurModal = true;
  }


  // ✅ Fermer le modal d'assignation
  closeAssignLivreurModal(): void {
    this.showAssignLivreurModal = false;
    this.selectedOrder = null;
    this.selectedLivreurId = null;
  }

  // ✅ Assigner un livreur à la commande
  assignLivreur(): void {
    if (!this.selectedOrder || !this.selectedLivreurId) {
      this.error = 'Veuillez sélectionner un livreur';
      return;
    }

    this.loading = true;
    this.orderService.assignLivreur(this.selectedOrder.id, this.selectedLivreurId).subscribe({
      next: (updatedOrder: Order) => {
        // Mettre à jour la commande dans la liste
        const index = this.orders.findIndex(o => o.id === updatedOrder.id);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
          this.filterOrders();
        }
        
        this.closeAssignLivreurModal();
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Erreur lors de l\'assignation du livreur';
        this.loading = false;
        console.error('Error assigning livreur:', error);
      }
    });
  }
  
  /**
   * Charge toutes les commandes depuis le service
   * Met à jour les statistiques et applique les filtres
   */
  loadOrders(): void {
    this.loading = true;
    this.error = null;

    // CORRECTION: getAllOrders() -> getOrders() et ajout des types
    this.orderService.getOrders().subscribe({
      next: (orders: Order[]) => {
        this.orders = orders;
        this.calculateStats();
        this.filterOrders();
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Erreur lors du chargement des commandes';
        this.loading = false;
        console.error('Error loading orders:', error);
      }
    });
  }

  /**
   * Calcule les statistiques du nombre de commandes par statut
   * Met à jour l'objet stats avec le décompte pour chaque statut
   */
  calculateStats(): void {
    this.stats = {
      pending: this.orders.filter(o => o.status === 'pending').length,
      preparing: this.orders.filter(o => o.status === 'preparing').length,
      ready: this.orders.filter(o => o.status === 'ready').length,
      delivering: this.orders.filter(o => o.status === 'delivering').length,
      delivered: this.orders.filter(o => o.status === 'delivered').length
    };
  }

  /**
   * Filtre les commandes selon le statut sélectionné et le terme de recherche
   * Trie les résultats par date de création (plus récentes en premier)
   */
  filterOrders(): void {
    let filtered = [...this.orders];

    // Filtre par statut
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === this.statusFilter);
    }

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(term) ||
        order.delivery_address.toLowerCase().includes(term)
      );
    }

    // Trier par date (plus récentes en premier)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    this.filteredOrders = filtered;
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
   * Met à jour le statut d'une commande spécifique
   * @param orderId - L'identifiant de la commande à mettre à jour
   * @param newStatus - Le nouveau statut à appliquer
   */
  updateOrderStatus(orderId: number, newStatus: OrderStatus): void {
    const statusData = { status: newStatus };
    
    this.orderService.updateOrderStatus(orderId, statusData).subscribe({
      next: (updatedOrder: Order) => {
        // Mettre à jour la commande dans la liste
        const index = this.orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
          this.calculateStats();
          this.filterOrders();
        }
        
        // Mettre à jour la commande sélectionnée si c'est celle-ci
        if (this.selectedOrder?.id === orderId) {
          this.selectedOrder = updatedOrder;
        }
      },
      error: (error: any) => {
        this.error = 'Erreur lors de la mise à jour du statut';
        console.error('Error updating order status:', error);
      }
    });
  }

  /**
   * Retourne la classe CSS appropriée pour le badge de statut
   * @param status - Le statut de la commande
   * @returns La classe CSS correspondante au statut
   */
  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'preparing': 'bg-blue-100 text-blue-800',
      'ready': 'bg-green-100 text-green-800',
      'delivering': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Retourne le libellé français correspondant au statut
   * @param status - Le statut de la commande en anglais
   * @returns Le libellé en français du statut
   */
  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'En attente',
      'preparing': 'En préparation',
      'ready': 'Prête',
      'delivering': 'En livraison',
      'delivered': 'Livrée',
      'cancelled': 'Annulée'
    };
    return statusLabels[status] || status;
  }

  /**
   * Retourne le libellé français de la méthode de paiement
   * @param method - La méthode de paiement
   * @returns Le libellé en français de la méthode de paiement
   */
  getPaymentMethodLabel(method: string): string {
    return method === 'cash_on_delivery' ? 'Paiement à la livraison' : 'Paiement en ligne';
  }

  /**
   * Retourne le libellé français du statut de paiement
   * @param status - Le statut de paiement
   * @returns Le libellé en français du statut de paiement
   */
  getPaymentStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'En attente',
      'paid': 'Payé',
      'failed': 'Échoué'
    };
    return statusLabels[status] || status;
  }

  /**
   * Retourne la classe CSS pour le statut de paiement
   * @param status - Le statut de paiement
   * @returns La classe CSS correspondante au statut de paiement
   */
  getPaymentStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Retourne une classe CSS pour mettre en évidence les commandes prioritaires
   * @param status - Le statut de la commande
   * @returns Une classe CSS pour les bordures de priorité
   */
  getPriorityClass(status: string): string {
    // Mettre en évidence les commandes prioritaires
    if (status === 'pending' || status === 'preparing') {
      return 'border-l-4 border-orange-400';
    }
    return '';
  }

  /**
   * Affiche les détails d'une commande dans une vue dédiée
   * @param order - La commande dont on veut afficher les détails
   */
  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetails = true;
  }

  /**
   * Ferme la vue des détails de commande
   * Remet à zéro la commande sélectionnée
   */
  closeOrderDetails(): void {
    this.showOrderDetails = false;
    this.selectedOrder = null;
  }

  /**
   * Formate une date sous forme de chaîne lisible
   * @param dateString - La date au format string ISO
   * @returns La date formatée au format français (JJ/MM/AAAA HH:MM)
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Fonction de tracking pour ngFor pour optimiser les performances
   * @param index - L'index de l'élément dans la liste
   * @param order - L'objet commande
   * @returns L'identifiant unique de la commande
   */
  trackByOrderId(index: number, order: Order): number {
    return order.id;
  }

  /**
   * Marque une commande comme prête pour la livraison
   * @param order - La commande à marquer comme prête
   */
  markAsReady(order: Order): void {
    this.updateOrderStatus(order.id, 'ready');
  }

  /**
   * Démarre la livraison d'une commande
   * @param order - La commande dont la livraison commence
   */
  startDelivery(order: Order): void {
    this.updateOrderStatus(order.id, 'delivering');
  }

  /**
   * Marque une commande comme livrée
   * @param order - La commande à marquer comme livrée
   */
  markAsDelivered(order: Order): void {
    this.updateOrderStatus(order.id, 'delivered');
  }

  /**
   * Détermine le prochain statut dans le flux de traitement
   * @param currentStatus - Le statut actuel de la commande
   * @returns Le prochain statut ou null si aucun suivant n'existe
   */
  getNextStatus(currentStatus: string): OrderStatus | null {
    const statusFlow: { [key: string]: OrderStatus } = {
      'pending': 'preparing',
      'preparing': 'ready',
      'ready': 'delivering',
      'delivering': 'delivered'
    };
    return statusFlow[currentStatus] || null;
  }

  /**
   * Retourne le libellé du prochain statut disponible
   * @param currentStatus - Le statut actuel de la commande
   * @returns Le libellé du prochain statut ou null
   */
  getNextStatusLabel(currentStatus: string): string | null {
    const nextStatus = this.getNextStatus(currentStatus);
    return nextStatus ? this.getStatusLabel(nextStatus) : null;
  }

  /**
   * Vérifie si une commande peut avancer au statut suivant
   * @param status - Le statut actuel de la commande
   * @returns true si la commande peut avancer, false sinon
   */
  canAdvanceStatus(status: string): boolean {
    return ['pending', 'preparing', 'ready', 'delivering'].includes(status);
  }
}