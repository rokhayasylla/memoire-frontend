import { Component, OnInit } from '@angular/core';
import { Product } from '../../models/product';
import { Category } from '../../models/category';
import { Promotion } from '../../models/promotion';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { PromotionService } from '../../services/promotion.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-products-catalog',
  templateUrl: './products-catalog.component.html',
  styleUrl: './products-catalog.component.css'
})
export class ProductsCatalogComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  activePromotions: Promotion[] = [];

  // Filters - Correction: selectedCategory en string pour correspondre au select HTML
  selectedCategory: string = '0';
  priceRange: { min: number; max: number } = { min: 0, max: 10000 };
  showPromotionsOnly = false;
  searchTerm = '';

  // Modal
  showProductModal = false;
  selectedProduct: Product | null = null;

  loading = false;
  error: string | null = null;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private promotionService: PromotionService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    Promise.all([
      this.productService.getProducts().toPromise(),
      this.categoryService.getCategories().toPromise(),
      this.promotionService.getActivePromotions().toPromise()
    ]).then(([products, categories, promotions]) => {
      this.products = products || [];
      this.categories = categories || [];
      this.activePromotions = promotions || [];
      this.applyFilters();
      this.loading = false;
    }).catch(error => {
      this.error = 'Erreur lors du chargement des données';
      this.loading = false;
      console.error('Error loading data:', error);
    });
  }

  applyFilters(): void {
    let filtered = [...this.products];

    // Filtre par catégorie - Correction: conversion en number
    const categoryId = parseInt(this.selectedCategory);
    if (categoryId > 0) {
      filtered = filtered.filter(product => product.category_id === categoryId);
    }

    // Filtre par prix
    filtered = filtered.filter(product =>
      product.price >= this.priceRange.min && product.price <= this.priceRange.max
    );

    // Filtre promotions uniquement
    if (this.showPromotionsOnly) {
      const promotionProductIds = this.activePromotions.flatMap(promo =>
        promo.products?.map(p => p.id) || []
      );
      filtered = filtered.filter(product => promotionProductIds.includes(product.id));
    }

    // Recherche par nom
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    this.filteredProducts = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onPriceRangeChange(): void {
    this.applyFilters();
  }

  onPromotionFilterChange(): void {
    this.applyFilters();
  }

  getProductImageUrl(product: Product): string | null {
    if (!product.image) return null;

    if (product.image.startsWith('http')) {
      return product.image;
    }

    const baseUrl = this.productService.baseApiUrl.replace('/api', '');
    return `${baseUrl}/storage/images/${product.image}`;
  }

  isProductInPromotion(product: Product): boolean {
    return this.activePromotions.some(promo =>
      promo.products?.some(p => p.id === product.id)
    );
  }

  getProductPromotion(product: Product): Promotion | null {
    return this.activePromotions.find(promo =>
      promo.products?.some(p => p.id === product.id)
    ) || null;
  }

  getPromotionPrice(product: Product): number {
    const promotion = this.getProductPromotion(product);
    if (!promotion) return product.price;

    if (promotion.discount_percentage) {
      return product.price * (1 - promotion.discount_percentage / 100);
    }

    if (promotion.discount_amount) {
      return Math.max(0, product.price - promotion.discount_amount);
    }

    return product.price;
  }

  addToCart(product: Product): void {
    this.cartService.addProductToCart(product, 1);
  }

  openProductModal(product: Product): void {
    this.selectedProduct = product;
    this.showProductModal = true;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.selectedProduct = null;
  }

  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Catégorie inconnue';
  }

  onImageError(event: any): void {
    // En cas d'erreur de chargement, masquer l'image
    event.target.style.display = 'none';
  }

  // Méthode pour optimiser le trackBy du ngFor
  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}
