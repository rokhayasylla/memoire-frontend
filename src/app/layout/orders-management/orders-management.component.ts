import {Component, OnInit} from '@angular/core';
import {Order} from "../../models/order";
import {OrderService} from "../../services/order.service";

@Component({
  selector: 'app-orders-management',
  templateUrl: './orders-management.component.html',
  styleUrl: './orders-management.component.css'
})
export class OrdersManagementComponent implements OnInit{
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedStatus: string = 'all';
  showOrderDetailsModal: boolean = false;
  currentOrder: Order | null = null;
  loading = false;
  error: string | null = null;

  statusOptions = [
    { value: 'all', label: 'Tous les statuts', color: 'gray' },
    { value: 'pending', label: 'En attente', color: 'yellow' },
    { value: 'preparing', label: 'En préparation', color: 'blue' },
    { value: 'ready', label: 'Prêt', color: 'purple' },
    { value: 'delivering', label: 'En livraison', color: 'indigo' },
    { value: 'delivered', label: 'Livré', color: 'green' },
    { value: 'cancelled', label: 'Annulé', color: 'red' }
  ];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;

    this.orderService.getOrders().subscribe({
      next: (orders) => {
        console.log('=== DEBUG ORDERS FROM API ===');
        console.log('Raw orders data:', orders);

        // Vérifier chaque commande
        orders.forEach((order, index) => {
          console.log(`Order ${index + 1}:`, {
            id: order.id,
            order_number: order.order_number,
            total_amount: order.total_amount,
            orderItems: order.order_items,
            orderItems_length: order.order_items?.length || 0,
            has_orderItems: !!order.order_items
          });
        });

        this.orders = orders.map(order => ({
          ...order,
          orderItems: order.order_items || []
        }));

        this.applyStatusFilter();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des commandes';
        this.loading = false;
        console.error('Error loading orders:', error);
      }
    });
  }

  // Méthode de debug pour une commande spécifique
  debugSpecificOrder(orderId: number): void {
    console.log('=== DEBUG SPECIFIC ORDER ===');
    this.orderService.getOrder(orderId).subscribe({
      next: (order) => {
        console.log('Full order details:', order);
        console.log('OrderItems:', order.order_items);
        console.log('OrderItems count:', order.order_items?.length || 0);

        if (order.order_items && order.order_items.length > 0) {
          order.order_items.forEach((item, index) => {
            console.log(`Item ${index + 1}:`, {
              id: item.id,
              item_type: item.item_type,
              quantity: item.quantity,
              product: item.product,
              pack: item.pack
            });
          });
        } else {
          console.log('NO ORDER ITEMS FOUND!');
        }
      },
      error: (error) => {
        console.error('Error loading order:', error);
      }
    });
  }

  onStatusFilterChange(): void {
    this.applyStatusFilter();
  }

  applyStatusFilter(): void {
    if (this.selectedStatus === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === this.selectedStatus);
    }
  }

  getStatusLabel(status: string): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    return statusOption?.label || status;
  }

  getStatusClass(status: string): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    const color = statusOption?.color || 'gray';

    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800'
    };

    return colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;
  }

  getPaymentMethodLabel(method: string): string {
    const methods = {
      'cash_on_delivery': 'Paiement à la livraison',
      'online': 'Paiement en ligne'
    };
    return methods[method as keyof typeof methods] || method;
  }

  getPaymentStatusClass(status: string): string {
    const statusClasses = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800';
  }

  getPaymentStatusLabel(status: string): string {
    const statusLabels = {
      'pending': 'En attente',
      'paid': 'Payé',
      'failed': 'Échec'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  }

  viewOrderDetails(order: Order): void {
    console.log('Order data:', order); // Debug log

    // Si les détails ne sont pas complets, charger la commande complète
    if (!order.orderItems || order.orderItems.length === 0 || !order.user?.phone) {
      this.loading = true;
      this.orderService.getOrder(order.id).subscribe({
        next: (fullOrder) => {
          console.log('Full order data:', fullOrder); // Debug log
          this.currentOrder = fullOrder;
          this.showOrderDetailsModal = true;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading order details:', error);
          this.currentOrder = order; // Fallback to original data
          this.showOrderDetailsModal = true;
          this.loading = false;
        }
      });
    } else {
      this.currentOrder = order;
      this.showOrderDetailsModal = true;
    }
  }

  closeOrderDetailsModal(): void {
    this.showOrderDetailsModal = false;
    this.currentOrder = null;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private toNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    // Si c'est déjà un nombre
    if (typeof value === 'number') {
      return value;
    }

    // Si c'est une chaîne, la convertir
    const parsed = parseFloat(value.toString());
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Calculer le total de la commande (montant final)
   */
  calculateOrderTotal(order: Order): number {
    return this.toNumber(order.total_amount);
  }

  /**
   * Calculer le sous-total (avant remise)
   */
  calculateSubTotal(order: Order): number {
    const total = this.toNumber(order.total_amount);
    const discount = this.toNumber(order.discount_amount);
    return total + discount;
  }

  /**
   * Compter le nombre total d'articles dans la commande
   * (gère à la fois les produits et les packs)
   */
  getOrderItemsCount(order: Order): number {
    if (!order.order_items || order.order_items.length === 0) {
      return 0;
    }

    return order.order_items.reduce((total, item) => {
      return total + (item.quantity || 0);
    }, 0);
  }

  /**
   * Calculer le total en additionnant tous les items
   * (pour vérification de cohérence)
   */
  calculateItemsTotal(order: Order): number {
    const items = this.getOrderItems(order);

    if (!items || items.length === 0) {
      return this.toNumber(order.total_amount);
    }

    return items.reduce((total, item) => {
      return total + this.toNumber(item.total_price);
    }, 0);
  }

  /**
   * Obtenir les order items d'une commande (gère les deux formats de nommage)
   */
  private getOrderItems(order: Order): any[] {
    // Laravel retourne order_items (snake_case), Angular attend orderItems (camelCase)
    return order.order_items || order.orderItems || [];
  }

  /**
   * Obtenir le montant de la remise
   */
  getDiscountAmount(order: Order): number {
    return this.toNumber(order.discount_amount);
  }

  /**
   * Obtenir le nom d'un item (produit ou pack)
   */
  getItemName(item: any): string {
    if (item.item_type === 'product' && item.product) {
      return item.product.name;
    } else if (item.item_type === 'pack' && item.pack) {
      return item.pack.name;
    }
    return 'Article supprimé';
  }

  /**
   * Obtenir la description d'un item
   */
  getItemDescription(item: any): string {
    if (item.item_type === 'product' && item.product) {
      return item.product.description || '';
    } else if (item.item_type === 'pack' && item.pack) {
      return item.pack.description || '';
    }
    return '';
  }

  /**
   * Vérifier si un item est un pack
   */
  isPackItem(item: any): boolean {
    return item.item_type === 'pack';
  }

  /**
   * Obtenir les produits contenus dans un pack
   */
  getPackProducts(item: any): any[] {
    if (this.isPackItem(item) && item.pack && item.pack.products) {
      return item.pack.products;
    }
    return [];
  }

  /**
   * Calculer le nombre total de produits individuels dans un pack
   */
  getPackProductsCount(item: any): number {
    if (!this.isPackItem(item)) return 0;

    const packProducts = this.getPackProducts(item);
    return packProducts.reduce((total, product) => {
      return total + (product.pivot?.quantity || 0);
    }, 0) * item.quantity;
  }

  trackByOrderId(index: number, order: Order): number {
    return order.id;
  }

  trackByItemId(index: number, item: any): number {
    return item.id;
  }

}
