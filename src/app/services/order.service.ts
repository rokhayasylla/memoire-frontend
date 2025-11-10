import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable, tap } from "rxjs";
import { CreateOrderRequest, Order, UpdateOrderStatusRequest, OrderStatus } from "../models/order";
import { InvoiceService } from "./invoice.service";

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = environment.ApiUrl;

  constructor(
    private http: HttpClient,
    private invoiceService: InvoiceService
  ) {}

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`);
  }

  createOrder(order: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/cart/checkout`, order);
  }

  /**
   * Met à jour le statut d'une commande et génère une facture si le statut devient "delivered"
   */
  updateOrderStatus(id: number, statusData: UpdateOrderStatusRequest): Observable<Order> {
  return this.http.patch<Order>(`${this.apiUrl}/orders/${id}/status`, statusData).pipe(
    tap(updatedOrder => {
      // ✅ Email quand la livraison commence
      if (updatedOrder.status === 'delivering') {
        this.sendDeliveryStartedEmail(updatedOrder);
      }
      
      // ✅ Email de facture quand la commande est livrée
      if (updatedOrder.status === 'delivered') {
        this.generateInvoiceForOrder(updatedOrder);
      }
    })
  );
}

/**
 * Envoie un email quand la livraison commence
 */
private sendDeliveryStartedEmail(order: Order): void {
  // Si vous avez un endpoint dédié pour cet email
  this.http.post(`${this.apiUrl}/orders/${order.id}/send-delivery-notification`, {}).subscribe({
    next: (response) => {
      console.log(`✅ Email de début de livraison envoyé pour la commande ${order.order_number}`);
    },
    error: (error) => {
      console.error(' Erreur lors de l\'envoi de l\'email de livraison:', error);
    }
  });
}


  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/my-orders`);
  }

  getOrdersByStatus(status: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/status/${status}`);
  }

  /**
   * Génère une facture pour une commande livrée
   */
  /**
 * Génère une facture pour une commande livrée et l'envoie par email
 */
private generateInvoiceForOrder(order: Order): void {
  // Vérifier si une facture n'existe pas déjà pour cette commande
  this.invoiceService.getInvoices().subscribe({
    next: (invoices) => {
      const existingInvoice = invoices.find(invoice => invoice.order?.id === order.id);
      
      if (!existingInvoice) {
        // Créer une nouvelle facture
        const invoiceData = {
          order_id: order.id,
          amount: order.total_amount,
          invoice_number: this.generateInvoiceNumber(),
          sent_by_email: false // On garde false pour la création
        };

        this.invoiceService.createInvoice(invoiceData).subscribe({
          next: (invoice) => {
            console.log('Facture générée automatiquement:', invoice);
            
            // ✅ Envoyer la facture par email après création
            this.invoiceService.sendInvoiceByEmail(invoice.id).subscribe({
              next: (emailResponse) => {
                console.log(`✅ Email de facture envoyé pour la commande ${order.order_number}`);
                console.log('Réponse email:', emailResponse);
              },
              error: (emailError) => {
                console.error('❌ Erreur lors de l\'envoi de l\'email de facture:', emailError);
              }
            });
          },
          error: (error) => {
            console.error('Erreur lors de la génération de la facture:', error);
          }
        });
      } else {
        console.log('Une facture existe déjà pour cette commande:', existingInvoice.invoice_number);
        
        // ✅ Si la facture existe mais n'a pas été envoyée, on peut l'envoyer
        if (!existingInvoice.sent_by_email) {
          this.invoiceService.sendInvoiceByEmail(existingInvoice.id).subscribe({
            next: (emailResponse) => {
              console.log(`✅ Email de facture existante envoyé pour la commande ${order.order_number}`);
            },
            error: (emailError) => {
              console.error('❌ Erreur lors de l\'envoi de l\'email de facture existante:', emailError);
            }
          });
        }
      }
    },
    error: (error) => {
      console.error('Erreur lors de la vérification des factures existantes:', error);
    }
  });
}
  /**
   * Génère un numéro de facture unique
   */
  private generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `FACT-${year}${month}${day}-${timestamp}`;
  }

  /**
   * Met à jour le statut avec validation et génération automatique de facture
   */
  updateOrderStatusWithInvoice(id: number, newStatus: OrderStatus): Observable<Order> {
    const statusData: UpdateOrderStatusRequest = {
      status: newStatus // Plus d'erreur TypeScript !
    };
    
    return this.updateOrderStatus(id, statusData);
  }

  /**
   * Version avec validation si vous recevez une string
   */
  updateOrderStatusFromString(id: number, statusString: string): Observable<Order> {
    // Validation du statut
    const validStatuses: OrderStatus[] = [
      'pending', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'
    ];
    
    if (!validStatuses.includes(statusString as OrderStatus)) {
      throw new Error(`Statut invalide: ${statusString}. Statuts valides: ${validStatuses.join(', ')}`);
    }
    
    return this.updateOrderStatusWithInvoice(id, statusString as OrderStatus);
  }

  /**
   * Finalise une commande (la marque comme livrée et génère la facture)
   */
  finalizeOrder(orderId: number): Observable<Order> {
    return this.updateOrderStatusWithInvoice(orderId, 'delivered');
  }

  /**
   * Méthodes utilitaires pour changer les statuts de manière type-safe
   */
  markAsPending(orderId: number): Observable<Order> {
    return this.updateOrderStatusWithInvoice(orderId, 'pending');
  }

  markAsPreparing(orderId: number): Observable<Order> {
    return this.updateOrderStatusWithInvoice(orderId, 'preparing');
  }

  markAsReady(orderId: number): Observable<Order> {
    return this.updateOrderStatusWithInvoice(orderId, 'ready');
  }

  markAsDelivering(orderId: number): Observable<Order> {
    return this.updateOrderStatusWithInvoice(orderId, 'delivering');
  }

  markAsDelivered(orderId: number): Observable<Order> {
    return this.updateOrderStatusWithInvoice(orderId, 'delivered');
  }

  markAsCancelled(orderId: number): Observable<Order> {
    return this.updateOrderStatusWithInvoice(orderId, 'cancelled');
  }


  // ✅ Nouvelle méthode pour assigner un livreur
  assignLivreur(orderId: number, livreurId: number): Observable<Order> {
    return this.http.post<Order>(
      `${this.apiUrl}/orders/${orderId}/assign-livreur`,
      { livreur_id: livreurId }
    );
  }

  //  Récupérer les commandes d'un livreur spécifique
  getLivreurOrders(livreurId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/livreur/${livreurId}`);
  }
  //  NOUVELLE MÉTHODE pour marquer le paiement comme reçu
markPaymentReceived(orderId: number): Observable<Order> {
  return this.http.post<Order>(
    `${this.apiUrl}/orders/${orderId}/mark-payment-received`,
    {}
  );
}


 getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/admin/orders`);
  }

// Obtenir une commande par ID
  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }
   

}