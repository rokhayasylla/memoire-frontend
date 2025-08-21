import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product';
import { Pack } from '../models/pack';
import { CartItem, CartResponse, AddProductToCartRequest, AddPackToCartRequest, UpdateCartItemRequest } from '../models/cart';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly apiUrl = environment.ApiUrl;
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  private cartItemCountSubject = new BehaviorSubject<number>(0);
  private cartTotalSubject = new BehaviorSubject<number>(0);

  public cartItems$ = this.cartItemsSubject.asObservable();
  public cartItemCount$ = this.cartItemCountSubject.asObservable();
  public cartTotal$ = this.cartTotalSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Charger le panier depuis l'API
  loadCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.apiUrl}/cart`);
  }

  // Ajouter un produit au panier
  addProduct(productId: number, quantity: number = 1): Observable<CartItem> {
    const request: AddProductToCartRequest = {
      product_id: productId,
      quantity: quantity
    };
    return this.http.post<CartItem>(`${this.apiUrl}/cart/add-product`, request);
  }

  // Ajouter un pack au panier
  addPack(packId: number, quantity: number = 1): Observable<CartItem> {
    const request: AddPackToCartRequest = {
      pack_id: packId,
      quantity: quantity
    };
    return this.http.post<CartItem>(`${this.apiUrl}/cart/add-pack`, request);
  }

  // Mettre à jour la quantité d'un item
  updateQuantity(itemId: number, quantity: number): Observable<CartItem> {
    const request: UpdateCartItemRequest = {
      quantity: quantity
    };
    return this.http.put<CartItem>(`${this.apiUrl}/cart/items/${itemId}`, request);
  }

  // Supprimer un item du panier
  removeItem(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cart/items/${itemId}`);
  }

  // Vider le panier
  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cart/clear`);
  }

  // Récupérer le total du panier
  getCartTotal(): Observable<{ total_amount: number }> {
    return this.http.get<{ total_amount: number }>(`${this.apiUrl}/cart/total`);
  }

  // Méthodes locales pour mettre à jour les BehaviorSubjects
  private updateCartData(cartResponse: CartResponse): void {
    this.cartItemsSubject.next(cartResponse.items);
    this.cartItemCountSubject.next(cartResponse.total_items);
    this.cartTotalSubject.next(cartResponse.total_amount);
  }

  // Méthodes helper pour les composants
  refreshCart(): void {
    this.loadCart().subscribe({
      next: (cartResponse) => {
        this.updateCartData(cartResponse);
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        // En cas d'erreur, réinitialiser le panier
        this.cartItemsSubject.next([]);
        this.cartItemCountSubject.next(0);
        this.cartTotalSubject.next(0);
      }
    });
  }

  // Afficher message de succès
  private showSuccessMessage(message: string): void {
    // Créer une notification toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Supprimer après 3 secondes
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // Ajouter produit et rafraîchir avec message de succès
  addProductToCart(product: Product, quantity: number = 1): void {
    this.addProduct(product.id, quantity).subscribe({
      next: () => {
        this.refreshCart();
        this.showSuccessMessage(`${product.name} ajouté au panier avec succès !`);
      },
      error: (error) => {
        console.error('Error adding product to cart:', error);
        this.showErrorMessage('Erreur lors de l\'ajout au panier');
      }
    });
  }

  // Ajouter pack et rafraîchir avec message de succès
  addPackToCart(pack: Pack, quantity: number = 1): void {
    this.addPack(pack.id, quantity).subscribe({
      next: () => {
        this.refreshCart();
        this.showSuccessMessage(`${pack.name} ajouté au panier avec succès !`);
      },
      error: (error) => {
        console.error('Error adding pack to cart:', error);
        this.showErrorMessage('Erreur lors de l\'ajout au panier');
      }
    });
  }

  // Afficher message d'erreur
  private showErrorMessage(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // Mettre à jour quantité et rafraîchir
  updateItemQuantity(itemId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItemFromCart(itemId);
      return;
    }

    this.updateQuantity(itemId, quantity).subscribe({
      next: () => {
        this.refreshCart();
      },
      error: (error) => {
        console.error('Error updating quantity:', error);
      }
    });
  }

  // Supprimer item et rafraîchir
  removeItemFromCart(itemId: number): void {
    this.removeItem(itemId).subscribe({
      next: () => {
        this.refreshCart();
      },
      error: (error) => {
        console.error('Error removing item:', error);
      }
    });
  }

  // Vider panier et rafraîchir
  clearAllCart(): void {
    this.clearCart().subscribe({
      next: () => {
        this.cartItemsSubject.next([]);
        this.cartItemCountSubject.next(0);
        this.cartTotalSubject.next(0);
      },
      error: (error) => {
        console.error('Error clearing cart:', error);
      }
    });
  }

  // Getters pour les valeurs actuelles
  getCurrentCartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  getCurrentCartCount(): number {
    return this.cartItemCountSubject.value;
  }

  getCurrentCartTotal(): number {
    return this.cartTotalSubject.value;
  }
}
