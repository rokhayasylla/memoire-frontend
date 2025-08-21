import { Component, OnInit } from '@angular/core';
import { Promotion, CreatePromotionRequest, UpdatePromotionRequest } from '../../models/promotion';
import { Product } from '../../models/product';
import { PromotionService } from '../../services/promotion.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-promotions-management',
  templateUrl: './promotions-management.component.html',
  styleUrl: './promotions-management.component.css'
})
export class PromotionsManagementComponent implements OnInit {
  promotions: Promotion[] = [];
  products: Product[] = [];
  showPromotionModal: boolean = false;
  showPromotionDetailsModal: boolean = false;
  isEditingPromotion: boolean = false;
  currentPromotion: Promotion | null = null;

  promotionForm = {
    name: '',
    description: '',
    discount_percentage: null as number | null,
    discount_amount: null as number | null,
    start_date: '',
    end_date: '',
    is_active: true,
    product_ids: [] as number[]
  };

  loading = false;
  error: string | null = null;

  constructor(
    private promotionService: PromotionService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadPromotions();
    this.loadProducts();
  }

  // Chargement des données
  loadPromotions(): void {
    this.loading = true;
    this.promotionService.getPromotions().subscribe({
      next: (promotions) => {
        this.promotions = promotions;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des promotions';
        this.loading = false;
        console.error('Error loading promotions:', error);
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

  // Gestion du modal
  openPromotionModal(promotion?: Promotion): void {
    this.isEditingPromotion = !!promotion;
    this.currentPromotion = promotion || null;

    if (promotion) {
      this.promotionForm = {
        name: promotion.name,
        description: promotion.description || '',
        discount_percentage: promotion.discount_percentage || null,
        discount_amount: promotion.discount_amount || null,
        start_date: this.formatDateForInput(promotion.start_date),
        end_date: this.formatDateForInput(promotion.end_date),
        is_active: promotion.is_active,
        product_ids: promotion.products?.map(p => p.id) || []
      };
    } else {
      this.promotionForm = {
        name: '',
        description: '',
        discount_percentage: null,
        discount_amount: null,
        start_date: '',
        end_date: '',
        is_active: true,
        product_ids: []
      };
    }

    this.showPromotionModal = true;
  }

  closePromotionModal(): void {
    this.showPromotionModal = false;
    this.isEditingPromotion = false;
    this.currentPromotion = null;
    this.resetForm();
  }

  resetForm(): void {
    this.promotionForm = {
      name: '',
      description: '',
      discount_percentage: null,
      discount_amount: null,
      start_date: '',
      end_date: '',
      is_active: true,
      product_ids: []
    };
  }

  // Sauvegarde
  savePromotionChanges(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = null;

    const formData = {
      name: this.promotionForm.name.trim(),
      description: this.promotionForm.description.trim(),
      discount_percentage: this.promotionForm.discount_percentage,
      discount_amount: this.promotionForm.discount_amount,
      start_date: this.promotionForm.start_date,
      end_date: this.promotionForm.end_date,
      is_active: this.promotionForm.is_active,
      product_ids: this.promotionForm.product_ids
    };

    if (this.isEditingPromotion && this.currentPromotion) {
      const updateData: UpdatePromotionRequest = formData;
      this.promotionService.updatePromotion(this.currentPromotion.id, updateData).subscribe({
        next: () => {
          this.loadPromotions();
          this.closePromotionModal();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la modification de la promotion';
          this.loading = false;
          console.error('Error updating promotion:', error);
        }
      });
    } else {
      const createData: CreatePromotionRequest = formData as CreatePromotionRequest;
      this.promotionService.createPromotion(createData).subscribe({
        next: () => {
          this.loadPromotions();
          this.closePromotionModal();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la création de la promotion';
          this.loading = false;
          console.error('Error creating promotion:', error);
        }
      });
    }
  }

  // Validation du formulaire
  validateForm(): boolean {
    if (!this.promotionForm.name.trim()) {
      this.error = 'Le nom de la promotion est obligatoire';
      return false;
    }

    if (!this.promotionForm.start_date) {
      this.error = 'La date de début est obligatoire';
      return false;
    }

    if (!this.promotionForm.end_date) {
      this.error = 'La date de fin est obligatoire';
      return false;
    }

    if (new Date(this.promotionForm.start_date) >= new Date(this.promotionForm.end_date)) {
      this.error = 'La date de fin doit être postérieure à la date de début';
      return false;
    }

    if (!this.promotionForm.discount_percentage && !this.promotionForm.discount_amount) {
      this.error = 'Veuillez spécifier soit un pourcentage soit un montant de réduction';
      return false;
    }

    if (this.promotionForm.discount_percentage && this.promotionForm.discount_amount) {
      this.error = 'Veuillez spécifier soit un pourcentage soit un montant, pas les deux';
      return false;
    }

    if (this.promotionForm.discount_percentage && (this.promotionForm.discount_percentage < 0 || this.promotionForm.discount_percentage > 100)) {
      this.error = 'Le pourcentage de réduction doit être entre 0 et 100';
      return false;
    }

    if (this.promotionForm.discount_amount && this.promotionForm.discount_amount < 0) {
      this.error = 'Le montant de réduction doit être positif';
      return false;
    }

    if (this.promotionForm.product_ids.length === 0) {
      this.error = 'Veuillez sélectionner au moins un produit';
      return false;
    }

    return true;
  }

  // Suppression
  deletePromotion(promotion: Promotion): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la promotion "${promotion.name}" ?`)) {
      this.loading = true;
      this.promotionService.deletePromotion(promotion.id).subscribe({
        next: () => {
          this.loadPromotions();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la suppression de la promotion';
          this.loading = false;
          console.error('Error deleting promotion:', error);
        }
      });
    }
  }

  // Modal des détails
  viewPromotion(promotion: Promotion): void {
    this.currentPromotion = promotion;
    this.showPromotionDetailsModal = true;
  }

  closePromotionDetailsModal(): void {
    this.showPromotionDetailsModal = false;
    this.currentPromotion = null;
  }

  // Gestion des produits
  toggleProductSelection(productId: number): void {
    const index = this.promotionForm.product_ids.indexOf(productId);
    if (index > -1) {
      this.promotionForm.product_ids.splice(index, 1);
    } else {
      this.promotionForm.product_ids.push(productId);
    }
  }

  isProductSelected(productId: number): boolean {
    return this.promotionForm.product_ids.includes(productId);
  }

  // Méthodes utilitaires
  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  getPromotionStatus(promotion: Promotion): string {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);

    if (!promotion.is_active) return 'Désactivée';
    if (now < startDate) return 'À venir';
    if (now > endDate) return 'Expirée';
    return 'Active';
  }

  getPromotionStatusClass(promotion: Promotion): string {
    const status = this.getPromotionStatus(promotion);
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'À venir': return 'bg-blue-100 text-blue-800';
      case 'Expirée': return 'bg-red-100 text-red-800';
      case 'Désactivée': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getDiscountText(promotion: Promotion): string {
    if (promotion.discount_percentage) {
      return `${promotion.discount_percentage}%`;
    }
    if (promotion.discount_amount) {
      return `${promotion.discount_amount} XOF`;
    }
    return '-';
  }

  getProductName(productId: number): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.name : 'Produit inconnu';
  }

  // Méthodes pour gérer les champs de réduction
  onDiscountPercentageChange(): void {
    if (this.promotionForm.discount_percentage !== null) {
      this.promotionForm.discount_amount = null;
    }
  }

  onDiscountAmountChange(): void {
    if (this.promotionForm.discount_amount !== null) {
      this.promotionForm.discount_percentage = null;
    }
  }

  trackByPromotionId(index: number, promotion: Promotion): number {
    return promotion.id;
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}
