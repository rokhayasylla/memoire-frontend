import { Component, OnInit } from '@angular/core';
import { Pack, CreatePackRequest, UpdatePackRequest } from '../../models/pack';
import { Product } from '../../models/product';
import { PackService } from '../../services/pack.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-packs-management',
  templateUrl: './packs-management.component.html',
  styleUrl: './packs-management.component.css'
})
export class PacksManagementComponent implements OnInit {
  packs: Pack[] = [];
  products: Product[] = [];
  showPackModal: boolean = false;
  showPackDetailsModal: boolean = false;
  isEditingPack: boolean = false;
  currentPack: Pack | null = null;
  selectedImageFile: File | null = null;
  previewImageUrl: string | null = null;

  packForm = {
    name: '',
    description: '',
    price: 0,
    is_active: true,
    products: [] as { product_id: number; quantity: number; product?: Product }[]
  };

  loading = false;
  error: string | null = null;

  constructor(
    private packService: PackService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadPacks();
    this.loadProducts();
  }

  loadPacks(): void {
    this.loading = true;
    this.packService.getPacks().subscribe({
      next: (packs) => {
        this.packs = packs;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des packs';
        this.loading = false;
        console.error('Error loading packs:', error);
      }
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  openPackModal(pack?: Pack): void {
    this.isEditingPack = !!pack;
    this.currentPack = pack || null;
    this.selectedImageFile = null;
    this.previewImageUrl = null;

    if (pack) {
      this.packForm = {
        name: pack.name,
        description: pack.description || '',
        price: pack.price,
        is_active: pack.is_active,
        products: pack.products?.map(p => ({
          product_id: p.id,
          quantity: p.pivot.quantity,
          product: p
        })) || []
      };
      this.previewImageUrl = pack.image_path || null;
    } else {
      this.packForm = {
        name: '',
        description: '',
        price: 0,
        is_active: true,
        products: []
      };
    }

    this.showPackModal = true;
  }

  closePackModal(): void {
    this.showPackModal = false;
    this.isEditingPack = false;
    this.currentPack = null;
    this.selectedImageFile = null;
    this.previewImageUrl = null;
    this.packForm = {
      name: '',
      description: '',
      price: 0,
      is_active: true,
      products: []
    };
    this.error = null;
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageFile = file;

      // Créer l'aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  addProductToPack(): void {
    this.packForm.products.push({
      product_id: 0,
      quantity: 1
    });
  }

  removeProductFromPack(index: number): void {
    this.packForm.products.splice(index, 1);
  }

  onProductChange(index: number, productId: number): void {
    const product = this.products.find(p => p.id === productId);
    this.packForm.products[index].product_id = productId;
    this.packForm.products[index].product = product;
  }

  calculatePackPrice(): number {
    return this.packForm.products.reduce((total, item) => {
      const product = this.products.find(p => p.id === item.product_id);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  }

  useCalculatedPrice(): void {
    this.packForm.price = this.calculatePackPrice();
  }

  savePackChanges(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = null;

    if (this.isEditingPack && this.currentPack) {
      const updateData: UpdatePackRequest = {
        name: this.packForm.name.trim(),
        description: this.packForm.description.trim() || undefined,
        price: this.packForm.price,
        is_active: this.packForm.is_active,
        products: this.packForm.products.map(p => ({
          product_id: p.product_id,
          quantity: p.quantity
        }))
      };

      if (this.selectedImageFile) {
        updateData.image = this.selectedImageFile;
      }

      this.packService.updatePack(this.currentPack.id, updateData).subscribe({
        next: () => {
          this.loadPacks();
          this.closePackModal();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la modification du pack';
          this.loading = false;
          console.error('Error updating pack:', error);
        }
      });
    } else {
      const createData: CreatePackRequest = {
        name: this.packForm.name.trim(),
        description: this.packForm.description.trim() || undefined,
        price: this.packForm.price,
        is_active: this.packForm.is_active,
        products: this.packForm.products.map(p => ({
          product_id: p.product_id,
          quantity: p.quantity
        }))
      };

      if (this.selectedImageFile) {
        createData.image_path = this.selectedImageFile;
      }

      this.packService.createPack(createData).subscribe({
        next: () => {
          this.loadPacks();
          this.closePackModal();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la création du pack';
          this.loading = false;
          console.error('Error creating pack:', error);
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.packForm.name.trim()) {
      this.error = 'Le nom du pack est obligatoire';
      return false;
    }

    if (this.packForm.price <= 0) {
      this.error = 'Le prix doit être supérieur à 0';
      return false;
    }

    if (this.packForm.products.length === 0) {
      this.error = 'Le pack doit contenir au moins un produit';
      return false;
    }

    for (let i = 0; i < this.packForm.products.length; i++) {
      const product = this.packForm.products[i];
      if (product.product_id === 0) {
        this.error = `Veuillez sélectionner un produit pour l'item ${i + 1}`;
        return false;
      }
      if (product.quantity <= 0) {
        this.error = `La quantité doit être supérieure à 0 pour l'item ${i + 1}`;
        return false;
      }
    }

    // Vérifier les doublons
    const productIds = this.packForm.products.map(p => p.product_id);
    const uniqueProductIds = [...new Set(productIds)];
    if (productIds.length !== uniqueProductIds.length) {
      this.error = 'Vous ne pouvez pas ajouter le même produit plusieurs fois';
      return false;
    }

    return true;
  }

  togglePackStatus(pack: Pack): void {
    const newStatus = !pack.is_active;
    const action = newStatus ? 'activer' : 'désactiver';

    if (confirm(`Êtes-vous sûr de vouloir ${action} le pack "${pack.name}" ?`)) {
      this.loading = true;

      // Utiliser la méthode spécifique pour le changement de statut
      this.packService.updatePackStatus(pack.id, newStatus).subscribe({
        next: () => {
          pack.is_active = newStatus; // Mettre à jour localement
          this.loading = false;
        },
        error: (error) => {
          this.error = `Erreur lors de la modification du statut du pack`;
          this.loading = false;
          console.error('Error toggling pack status:', error);
        }
      });
    }
  }

  deletePack(pack: Pack): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le pack "${pack.name}" ? Cette action est irréversible.`)) {
      this.loading = true;
      this.packService.deletePack(pack.id).subscribe({
        next: () => {
          this.loadPacks();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la suppression du pack';
          this.loading = false;
          console.error('Error deleting pack:', error);
        }
      });
    }
  }

  viewPackDetails(pack: Pack): void {
    // Si les détails ne sont pas complets, charger le pack complet
    if (!pack.products || pack.products.length === 0) {
      this.loading = true;
      this.packService.getPack(pack.id).subscribe({
        next: (fullPack) => {
          this.currentPack = fullPack;
          this.showPackDetailsModal = true;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading pack details:', error);
          this.currentPack = pack; // Fallback to original data
          this.showPackDetailsModal = true;
          this.loading = false;
        }
      });
    } else {
      this.currentPack = pack;
      this.showPackDetailsModal = true;
    }
  }

  closePackDetailsModal(): void {
    this.showPackDetailsModal = false;
    this.currentPack = null;
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Actif' : 'Inactif';
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

  getProductName(productId: number): string {
    const product = this.products.find(p => p.id === productId);
    return product?.name || 'Produit introuvable';
  }

  getProductPrice(productId: number): number {
    const product = this.products.find(p => p.id === productId);
    return product?.price || 0;
  }

  calculateTotalProducts(pack: Pack): number {
    return pack.products?.reduce((total, product) => total + product.pivot.quantity, 0) || 0;
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    // Si l'image contient déjà l'URL complète, la retourner telle quelle
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // Sinon, construire l'URL complète vers le serveur Laravel
    return `http://localhost:8000/storage/packs/${imagePath}`;
  }

  getProductImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    // Si l'image contient déjà l'URL complète, la retourner telle quelle
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // Sinon, construire l'URL complète vers le serveur Laravel
    return `http://localhost:8000/storage/images/${imagePath}`;
  }

  trackByPackId(index: number, pack: Pack): number {
    return pack.id;
  }

  trackByProductIndex(index: number, item: any): number {
    return index;
  }
}
