import { Component, OnInit } from '@angular/core';
import { Order, OrderStatus } from '../../models/order';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-employee-orders',
  templateUrl: './employee-orders.component.html',
  styleUrl: './employee-orders.component.css'
})
export class EmployeeOrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  error: string | null = null;
  selectedOrder: Order | null = null;
  showOrderDetails = false;
  updatingStatus = false;

  constructor(private orderService: OrderService) {}

  /**
   * Initialise le composant au démarrage
   * Charge les commandes et démarre le rafraîchissement automatique toutes les 30 secondes
   */
  ngOnInit(): void {
    this.loadOrders();
    // Rafraîchissement automatique toutes les 30 secondes pour voir les nouvelles commandes
    setInterval(() => {
      this.loadOrders();
    }, 30000);
  }

  /**
   * Charge toutes les commandes depuis le service
   * Trie les commandes par date de création (plus récentes en premier)
   */
  loadOrders(): void {
    this.loading = true;
    this.error = null;

    this.orderService.getOrders().subscribe({
      next: (orders: Order[]) => {
        // Trier par date (plus récentes en premier)
        this.orders = orders.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
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
   * Met à jour le statut d'une commande avec génération automatique de facture
   * @param order - La commande à mettre à jour
   * @param newStatus - Le nouveau statut à appliquer
   */
  updateOrderStatus(order: Order, newStatus: OrderStatus): void {
    this.updatingStatus = true;
    
    this.orderService.updateOrderStatusWithInvoice(order.id, newStatus).subscribe({
      next: (updatedOrder: Order) => {
        // Mettre à jour la commande dans la liste
        const index = this.orders.findIndex(o => o.id === order.id);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
        }
        
        this.updatingStatus = false;
        
        // Afficher un message de succès simple
        if (newStatus === 'delivered') {
          console.log('Commande marquée comme livrée. Facture générée automatiquement.');
        } else {
          console.log('Statut de la commande mis à jour avec succès.');
        }
      },
      error: (error: any) => {
        this.error = 'Erreur lors de la mise à jour du statut';
        this.updatingStatus = false;
        console.error('Error updating order status:', error);
      }
    });
  }

  /**
   * Finalise une commande (la marque comme livrée)
   * Demande confirmation avant de procéder à la finalisation
   * @param order - La commande à finaliser
   */
  finalizeOrder(order: Order): void {
    if (confirm('Êtes-vous sûr de vouloir marquer cette commande comme livrée ? Une facture sera générée automatiquement.')) {
      this.updateOrderStatus(order, 'delivered');
    }
  }

  /**
   * Avance une commande à l'étape suivante dans le flux de traitement
   * Demande confirmation avant chaque changement de statut
   * @param order - La commande à faire avancer
   */
  advanceOrderStatus(order: Order): void {
    const statusFlow: Record<OrderStatus, OrderStatus> = {
      'pending': 'preparing',
      'preparing': 'ready',
      'ready': 'delivering',
      'delivering': 'delivered',
      'delivered': 'delivered', // Pas de changement possible
      'cancelled': 'cancelled' // Pas de changement possible
    };

    const nextStatus = statusFlow[order.status];
    if (nextStatus && nextStatus !== order.status) {
      const confirmMessage = nextStatus === 'delivered' 
        ? 'Marquer cette commande comme livrée ? Une facture sera générée automatiquement.'
        : `Passer la commande au statut "${this.getStatusLabel(nextStatus)}" ?`;
        
      if (confirm(confirmMessage)) {
        this.updateOrderStatus(order, nextStatus);
      }
    }
  }

  /**
   * Vérifie si une commande peut avancer au statut suivant
   * @param order - La commande à vérifier
   * @returns true si la commande peut avancer, false sinon
   */
  canAdvanceStatus(order: Order): boolean {
    const advancableStatuses: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivering'];
    return advancableStatuses.includes(order.status);
  }

  /**
   * Obtient le libellé du prochain statut possible pour une commande
   * @param order - La commande dont on veut connaître le prochain statut
   * @returns Le libellé en français du prochain statut ou une chaîne vide
   */
  getNextStatusLabel(order: Order): string {
    const statusFlow: Record<OrderStatus, string> = {
      'pending': 'En préparation',
      'preparing': 'Prête',
      'ready': 'En livraison',
      'delivering': 'Livrée',
      'delivered': '',
      'cancelled': ''
    };

    return statusFlow[order.status] || '';
  }

  /**
   * Marque une commande comme "En préparation"
   * Demande confirmation avant de procéder au changement
   * @param order - La commande à marquer en préparation
   */
  markAsPreparing(order: Order): void {
    if (confirm('Marquer cette commande comme "En préparation" ?')) {
      this.updateOrderStatus(order, 'preparing');
    }
  }

  /**
   * Marque une commande comme "Prête"
   * Demande confirmation avant de procéder au changement
   * @param order - La commande à marquer comme prête
   */
  markAsReady(order: Order): void {
    if (confirm('Marquer cette commande comme "Prête" ?')) {
      this.updateOrderStatus(order, 'ready');
    }
  }

  /**
   * Marque une commande comme "En livraison"
   * Demande confirmation avant de procéder au changement
   * @param order - La commande à marquer en livraison
   */
  markAsDelivering(order: Order): void {
    if (confirm('Marquer cette commande comme "En livraison" ?')) {
      this.updateOrderStatus(order, 'delivering');
    }
  }

  /**
   * Annule une commande
   * Demande confirmation avant de procéder à l'annulation
   * @param order - La commande à annuler
   */
  cancelOrder(order: Order): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      this.updateOrderStatus(order, 'cancelled');
    }
  }

  /**
   * Retourne la classe CSS appropriée pour le badge de statut
   * @param status - Le statut de la commande
   * @returns La classe CSS correspondante au statut
   */
  getStatusBadgeClass(status: OrderStatus): string {
    const statusClasses: Record<OrderStatus, string> = {
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
  getStatusLabel(status: OrderStatus): string {
    const statusLabels: Record<OrderStatus, string> = {
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
   * Récupère le nom complet du client de la commande
   * @param order - La commande dont on veut le nom du client
   * @returns Le nom complet du client ou "Client inconnu" si indisponible
   */
  getCustomerName(order: Order): string {
    return order.user?.full_name || 'Client inconnu';
  }

  /**
   * Récupère l'email du client de la commande
   * @param order - La commande dont on veut l'email du client
   * @returns L'email du client ou une chaîne vide si indisponible
   */
  getCustomerEmail(order: Order): string {
    return order.user?.email || '';
  }

  /**
   * Récupère le téléphone du client de la commande
   * @param order - La commande dont on veut le téléphone du client
   * @returns Le numéro de téléphone du client ou une chaîne vide si indisponible
   */
  getCustomerPhone(order: Order): string {
    return order.user?.phone || '';
  }

  /**
   * Récupère l'adresse du client de la commande
   * @param order - La commande dont on veut l'adresse du client
   * @returns L'adresse du client ou une chaîne vide si indisponible
   */
  getCustomerAddress(order: Order): string {
    return order.user?.address || '';
  }

  /**
   * Récupère le rôle du client en français
   * @param order - La commande dont on veut le rôle du client
   * @returns Le libellé français du rôle du client ou une chaîne vide
   */
  getCustomerRole(order: Order): string {
    const roleLabels = {
      'admin': 'Administrateur',
      'employee': 'Employé',
      'client': 'Client',
      'livreur': 'Livreur'
    };
    return order.user ? roleLabels[order.user.role] : '';
  }

  /**
   * Vérifie si le client de la commande est actif
   * @param order - La commande dont on veut vérifier le statut du client
   * @returns true si le client est actif, false sinon
   */
  isActiveCustomer(order: Order): boolean {
    return order.user?.is_active || false;
  }
}