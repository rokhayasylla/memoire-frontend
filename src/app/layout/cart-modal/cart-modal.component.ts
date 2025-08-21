import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cart';
import { OrderService } from '../../services/order.service';
import { CreateOrderRequest } from '../../models/order';

@Component({
  selector: 'app-cart-modal',
  templateUrl: './cart-modal.component.html',
  styleUrl: './cart-modal.component.css'
})
export class CartModalComponent implements OnInit {
  @Output() closeModal = new EventEmitter<void>();

  cartItems: CartItem[] = [];
  totalAmount = 0;
  showCheckout = false;

  // Checkout form
  checkoutForm = {
    delivery_address: '',
    payment_method: 'cash_on_delivery',
    notes: ''
  };

  loading = false;
  error: string | null = null;

  constructor(
    private cartService: CartService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    // Charger le panier au démarrage
    this.cartService.refreshCart();

    // S'abonner aux changements
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });

    this.cartService.cartTotal$.subscribe(total => {
      this.totalAmount = total;
    });
  }

  updateQuantity(item: CartItem, quantity: number): void {
    this.cartService.updateItemQuantity(item.id, quantity);
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItemFromCart(item.id);
  }

  clearCart(): void {
    if (confirm('Êtes-vous sûr de vouloir vider le panier ?')) {
      this.cartService.clearAllCart();
    }
  }

  proceedToCheckout(): void {
    if (this.cartItems.length === 0) {
      this.error = 'Votre panier est vide';
      return;
    }
    this.showCheckout = true;
    this.error = null;
  }

  goBackToCart(): void {
    this.showCheckout = false;
    this.error = null;
  }

  placeOrder(): void {
    if (!this.checkoutForm.delivery_address.trim()) {
      this.error = 'L\'adresse de livraison est obligatoire';
      return;
    }

    this.loading = true;
    this.error = null;

    // Préparer les items pour la commande (seulement les produits)
    const orderItems = this.cartItems
      .filter(item => item.product_id) // Seulement les produits
      .map(item => ({
        product_id: item.product_id!,
        quantity: item.quantity
      }));

    if (orderItems.length === 0) {
      this.error = 'Aucun produit dans le panier';
      this.loading = false;
      return;
    }

    const orderData: CreateOrderRequest = {
      items: orderItems,
      delivery_address: this.checkoutForm.delivery_address.trim(),
      payment_method: this.checkoutForm.payment_method as 'cash_on_delivery' | 'online',
      notes: this.checkoutForm.notes.trim() || undefined
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        // Vider le panier après commande réussie
        this.cartService.clearAllCart();
        alert('Commande passée avec succès !');
        this.closeModal.emit();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors de la création de la commande';
        this.loading = false;
        console.error('Error creating order:', error);
      }
    });
  }

  close(): void {
    this.closeModal.emit();
  }

  getItemImageUrl(item: CartItem): string | null {
    const baseUrl = 'http://localhost:8000';

    if (item.item_type === 'product' && item.product) {
      if (!item.product.image) {
        console.log('Pas d\'image pour le produit:', item.product);
        return null;
      }

      console.log('Product image found:', item.product.image);

      // Si l'URL est déjà complète (commence par http)
      if (item.product.image.startsWith('http')) {
        return item.product.image;
      }

      // Si le chemin commence déjà par /storage/, l'utiliser directement
      if (item.product.image.startsWith('/storage/')) {
        return `${baseUrl}${item.product.image}`;
      }

      // Si le chemin commence par storage/ (sans slash initial)
      if (item.product.image.startsWith('storage/')) {
        return `${baseUrl}/${item.product.image}`;
      }

      // Sinon, construire le chemin complet
      const imageUrl = `${baseUrl}/storage/images/${item.product.image}`;
      console.log('Generated product URL:', imageUrl);
      return imageUrl;

    } else if (item.item_type === 'pack' && item.pack) {
      if (!item.pack.image_path) {
        console.log('Pas d\'image_path pour le pack:', item.pack);
        return null;
      }

      console.log('Pack image_path found:', item.pack.image_path);

      // Si l'URL est déjà complète (commence par http)
      if (item.pack.image_path.startsWith('http')) {
        return item.pack.image_path;
      }

      // Si le chemin commence déjà par /storage/, l'utiliser directement
      if (item.pack.image_path.startsWith('/storage/')) {
        return `${baseUrl}${item.pack.image_path}`;
      }

      // Si le chemin commence par storage/ (sans slash initial)
      if (item.pack.image_path.startsWith('storage/')) {
        return `${baseUrl}/${item.pack.image_path}`;
      }

      // Sinon, construire le chemin complet
      const imageUrl = `${baseUrl}/storage/packs/${item.pack.image_path}`;
      console.log('Generated pack URL:', imageUrl);
      return imageUrl;
    }

    console.log('Aucune condition remplie pour l\'item:', item);
    return null;
  }


  getItemName(item: CartItem): string {
    if (item.item_type === 'product' && item.product) {
      return item.product.name;
    } else if (item.item_type === 'pack' && item.pack) {
      return item.pack.name;
    }

    return 'Article inconnu';
  }

  getItemPrice(item: CartItem): number {
    // Si unit_price est disponible, l'utiliser
    if (item.unit_price) {
      return item.unit_price;
    }

    // Sinon calculer depuis le produit ou pack
    if (item.product_id && item.product) {
      return item.product.price;
    } else if (item.pack_id && item.pack) {
      return item.pack.price;
    }

    return 0;
  }

  // Méthode pour calculer le prix total d'un item
  getItemTotal(item: CartItem): number {
    if (item.total_price) {
      return item.total_price;
    }

    return this.getItemPrice(item) * item.quantity;
  }

  getItemType(item: CartItem): string {
    return item.item_type;
  }

  // Méthode pour gérer les erreurs d'image
  onImageError(event: any): void {
    // Cacher l'image en cas d'erreur et afficher un placeholder
    const img = event.target;
    img.style.display = 'none';

    // Trouver le conteneur parent et ajouter un placeholder
    const container = img.parentElement;
    if (container && !container.querySelector('.image-placeholder')) {
      const placeholder = document.createElement('div');
      placeholder.className = 'image-placeholder w-full h-full flex items-center justify-center text-gray-400';
      placeholder.innerHTML = '<i class="fas fa-image text-2xl"></i>';
      container.appendChild(placeholder);
    }
  }
}
