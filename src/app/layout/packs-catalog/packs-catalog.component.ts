import { Component, OnInit } from '@angular/core';
import { Pack } from '../../models/pack';
import { PackService } from '../../services/pack.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-packs-catalog',
  templateUrl: './packs-catalog.component.html',
  styleUrl: './packs-catalog.component.css'
})
export class PacksCatalogComponent implements OnInit {
  packs: Pack[] = [];
  filteredPacks: Pack[] = [];

  // Filters
  priceRange: { min: number; max: number } = { min: 0, max: 20000 };

  // Modal
  showPackModal = false;
  selectedPack: Pack | null = null;

  loading = false;
  error: string | null = null;

  constructor(
    private packService: PackService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.loadPacks();
  }

  loadPacks(): void {
    this.loading = true;
    this.packService.getActivePacks().subscribe({
      next: (packs) => {
        this.packs = packs;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des packs';
        this.loading = false;
        console.error('Error loading packs:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.packs];

    // Filtre par prix
    filtered = filtered.filter(pack =>
      pack.price >= this.priceRange.min && pack.price <= this.priceRange.max
    );

    this.filteredPacks = filtered;
  }

  onPriceRangeChange(): void {
    this.applyFilters();
  }

  getPackImageUrl(pack: Pack): string | null {
    if (!pack.image_path) return null;

    if (pack.image_path.startsWith('http')) {
      return pack.image_path;
    }

    // Utiliser l'URL de base du service pack
    const baseUrl = this.packService.apiUrl.replace('/api', '');
    return `${baseUrl}/storage/packs/${pack.image_path}`;
  }

  addToCart(pack: Pack): void {
    this.cartService.addPackToCart(pack, 1);
  }

  openPackModal(pack: Pack): void {
    this.selectedPack = pack;
    this.showPackModal = true;
  }

  closePackModal(): void {
    this.showPackModal = false;
    this.selectedPack = null;
  }

  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  getTotalProductsInPack(pack: Pack): number {
    return pack.products?.reduce((total, product) => total + product.pivot.quantity, 0) || 0;
  }

  onImageError(event: any): void {
    // En cas d'erreur de chargement, masquer l'image
    event.target.style.display = 'none';
  }
}
