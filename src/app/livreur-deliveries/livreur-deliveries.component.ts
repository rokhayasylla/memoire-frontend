import { Component, OnInit } from '@angular/core';
import { Order, OrderStatus, UpdateOrderStatusRequest } from '../models/order';
import { OrderService } from '../services/order.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-livreur-deliveries',
  templateUrl: './livreur-deliveries.component.html',
  styleUrl: './livreur-deliveries.component.css'
})
export class LivreurDeliveriesComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = false;
  error: string | null = null;
  selectedOrder: Order | null = null;
  showOrderDetails = false;
  
  // Filtres
  statusFilter = 'all';
  searchTerm = '';
  
  // Statistiques (sans 'ready' car vous l'avez supprimé du HTML)
  stats = {
    delivering: 0,
    delivered: 0
  };

  constructor(
    private orderService: OrderService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadMyDeliveries();
    
    // Rafraîchissement automatique toutes les 30 secondes
    setInterval(() => {
      this.loadMyDeliveries();
    }, 30000);
  }

  /**
   * Charge les livraisons assignées au livreur connecté
   */
  loadMyDeliveries(): void {
    this.loading = true;
    this.error = null;

    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) {
      this.error = 'Utilisateur non connecté';
      this.loading = false;
      return;
    }

    this.orderService.getLivreurOrders(currentUser.id).subscribe({
      next: (orders: Order[]) => {
        this.orders = orders;
        this.calculateStats();
        this.filterOrders();
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Erreur lors du chargement des livraisons';
        this.loading = false;
        console.error('Error loading deliveries:', error);
      }
    });
  }

  /**
   * Calcule les statistiques
   */
  calculateStats(): void {
    this.stats = {
      delivering: this.orders.filter(o => o.status === 'delivering').length,
      delivered: this.orders.filter(o => o.status === 'delivered').length
    };
  }

  /**
   * Filtre les commandes
   */
  filterOrders(): void {
    let filtered = [...this.orders];

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === this.statusFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(term) ||
        order.delivery_address.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    this.filteredOrders = filtered;
  }

  onStatusFilterChange(): void {
    this.filterOrders();
  }

  onSearchChange(): void {
    this.filterOrders();
  }

  /**
   * ✅ CORRECTION : Ajout du type UpdateOrderStatusRequest
   */
  updateOrderStatus(orderId: number, newStatus: OrderStatus): void {
    const statusData: UpdateOrderStatusRequest = { 
      status: newStatus 
    };
    
    this.orderService.updateOrderStatus(orderId, statusData).subscribe({
      next: (updatedOrder: Order) => {
        const index = this.orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
          this.calculateStats();
          this.filterOrders();
        }
        
        if (this.selectedOrder?.id === orderId) {
          this.selectedOrder = updatedOrder;
        }

        // ✅ Message de confirmation si livraison terminée
        if (newStatus === 'delivered') {
          alert('✅ Livraison terminée avec succès ! Le paiement a été marqué comme reçu.');
        }
      },
      error: (error: any) => {
        this.error = 'Erreur lors de la mise à jour du statut';
        console.error('Error updating order status:', error);
      }
    });
  }

  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetails = true;
  }

  closeOrderDetails(): void {
    this.showOrderDetails = false;
    this.selectedOrder = null;
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'ready': 'bg-green-100 text-green-800',
      'delivering': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-gray-100 text-gray-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'ready': 'Prête',
      'delivering': 'En livraison',
      'delivered': 'Livrée'
    };
    return statusLabels[status] || status;
  }

  getPaymentMethodLabel(method: string): string {
    return method === 'cash_on_delivery' ? 'Paiement à la livraison' : 'Paiement en ligne';
  }

  getPaymentStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'En attente',
      'paid': 'Payé',
      'failed': 'Échoué'
    };
    return statusLabels[status] || status;
  }

  getPaymentStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByOrderId(index: number, order: Order): number {
    return order.id;
  }

  startDelivery(orderId: number): void {
    this.updateOrderStatus(orderId, 'delivering');
  }

  completeDelivery(orderId: number): void {
    const order = this.orders.find(o => o.id === orderId);
    
    if (!order) {
      this.error = 'Commande introuvable';
      return;
    }

    const isPaidOnDelivery = order.payment_method === 'cash_on_delivery';
    
   // ✅ NOUVELLE LOGIQUE : Seulement marquer le paiement comme reçu
  if (isPaidOnDelivery) {
    const message = '✅ Confirmer que le client a bien payé ?\n\n⚠️ Le statut de paiement sera mis à jour.\nL\'employé devra ensuite marquer la commande comme livrée.';
    
    if (confirm(message)) {
      this.markPaymentReceived(orderId);
    }
  } else {
    alert('Cette commande a été payée en ligne. Contactez l\'employé pour la marquer comme livrée.');
  }
  }


// ✅ NOUVELLE MÉTHODE
markPaymentReceived(orderId: number): void {
  this.orderService.markPaymentReceived(orderId).subscribe({
    next: (updatedOrder: Order) => {
      const index = this.orders.findIndex(o => o.id === orderId);
      if (index !== -1) {
        this.orders[index] = updatedOrder;
        this.filterOrders();
      }
      
      if (this.selectedOrder?.id === orderId) {
        this.selectedOrder = updatedOrder;
      }

      alert('✅ Paiement marqué comme reçu ! L\'employé peut maintenant marquer la commande comme livrée.');
    },
    error: (error: any) => {
      this.error = 'Erreur lors de la mise à jour du paiement';
      console.error('Error marking payment as received:', error);
    }
  });
}


  canStartDelivery(status: string): boolean {
    return status === 'ready';
  }

  canCompleteDelivery(status: string): boolean {
    return status === 'delivering';
  }
}