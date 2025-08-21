import { Component, OnInit } from '@angular/core';
import { Order } from '../../models/order';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-client-orders',
  templateUrl: './client-orders.component.html',
  styleUrl: './client-orders.component.css'
})
export class ClientOrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  error: string | null = null;
  selectedOrder: Order | null = null;
  showOrderDetails = false;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;

    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des commandes';
        this.loading = false;
        console.error('Error loading orders:', error);
      }
    });
  }

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

  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetails = true;
  }

  closeOrderDetails(): void {
    this.showOrderDetails = false;
    this.selectedOrder = null;
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
}
