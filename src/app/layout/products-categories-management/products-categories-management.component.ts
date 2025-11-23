import { Component, OnInit } from '@angular/core';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../models/category';
import { Product, CreateProductRequest, UpdateProductRequest } from '../../models/product';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-products-categories-management',
  templateUrl: './products-categories-management.component.html',
  styleUrl: './products-categories-management.component.css'
})
export class ProductsCategoriesManagementComponent implements OnInit {
  activeTab: string = 'categories';

  // Categories
  categories: Category[] = [];
  showCategoryModal: boolean = false;
  isEditingCategory: boolean = false;
  currentCategory: Category | null = null;
  categoryForm = {
    name: ''
  };

  // Products
  products: Product[] = [];
  showProductModal: boolean = false;
  showProductDetailsModal: boolean = false;
  isEditingProduct: boolean = false;
  currentProduct: Product | null = null;
  selectedImageFile: File | null = null;
  productForm = {
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    allergens: '',
    category_id: 0
  };

  loading = false;
  error: string | null = null;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  // Tab Management
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  getTabClass(tab: string): string {
    return this.activeTab === tab
      ? 'border-orange-500 text-orange-600 bg-orange-50'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
  }

  // Categories Management
  loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des catégories';
        this.loading = false;
        console.error('Error loading categories:', error);
      }
    });
  }

  openCategoryModal(category?: Category): void {
    this.isEditingCategory = !!category;
    this.currentCategory = category || null;

    if (category) {
      this.categoryForm = {
        name: category.name
      };
    } else {
      this.categoryForm = {
        name: ''
      };
    }

    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
    this.isEditingCategory = false;
    this.currentCategory = null;
    this.categoryForm = { name: '' };
  }

  saveCategoryChanges(): void {
    if (!this.categoryForm.name.trim()) {
      this.error = 'Le nom de la catégorie est obligatoire';
      return;
    }

    this.loading = true;
    this.error = null;

    if (this.isEditingCategory && this.currentCategory) {
      const updateData: UpdateCategoryRequest = {
        name: this.categoryForm.name.trim()
      };

      this.categoryService.updateCategory(this.currentCategory.id, updateData).subscribe({
        next: () => {
          this.loadCategories();
          this.closeCategoryModal();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la modification de la catégorie';
          this.loading = false;
          console.error('Error updating category:', error);
        }
      });
    } else {
      const createData: CreateCategoryRequest = {
        name: this.categoryForm.name.trim()
      };

      this.categoryService.createCategory(createData).subscribe({
        next: () => {
          this.loadCategories();
          this.closeCategoryModal();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la création de la catégorie';
          this.loading = false;
          console.error('Error creating category:', error);
        }
      });
    }
  }

  deleteCategory(category: Category): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
      this.loading = true;
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.loadCategories();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la suppression de la catégorie';
          this.loading = false;
          console.error('Error deleting category:', error);
        }
      });
    }
  }

  // Products Management
  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des produits';
        this.loading = false;
        console.error('Error loading products:', error);
      }
    });
  }

  openProductModal(product?: Product): void {
    this.isEditingProduct = !!product;
    this.currentProduct = product || null;
    this.selectedImageFile = null;

    if (product) {
      this.productForm = {
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock_quantity: product.stock_quantity,
        allergens: product.allergens || '',
        category_id: product.category_id
      };
    } else {
      this.productForm = {
        name: '',
        description: '',
        price: 0,
        stock_quantity: 0,
        allergens: '',
        category_id: 0
      };
    }

    this.showProductModal = true;
  }

  closeProductModal(): void {
    this.showProductModal = false;
    this.isEditingProduct = false;
    this.currentProduct = null;
    this.selectedImageFile = null;
    this.productForm = {
      name: '',
      description: '',
      price: 0,
      stock_quantity: 0,
      allergens: '',
      category_id: 0
    };
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageFile = file;
    }
  }

  saveProductChanges(): void {
    if (!this.productForm.name.trim()) {
      this.error = 'Le nom du produit est obligatoire';
      return;
    }

    if (this.productForm.price <= 0) {
      this.error = 'Le prix doit être supérieur à 0';
      return;
    }

    if (this.productForm.category_id <= 0) {
      this.error = 'Veuillez sélectionner une catégorie';
      return;
    }

    if (!this.isEditingProduct && !this.selectedImageFile) {
      this.error = 'Une image est obligatoire pour créer un produit';
      return;
    }

    this.loading = true;
    this.error = null;

    if (this.isEditingProduct && this.currentProduct) {
      const updateData: UpdateProductRequest = {
        name: this.productForm.name.trim(),
        description: this.productForm.description.trim(),
        price: this.productForm.price,
        stock_quantity: this.productForm.stock_quantity,
        allergens: this.productForm.allergens.trim(),
        category_id: this.productForm.category_id
      };

      if (this.selectedImageFile) {
        updateData.image = this.selectedImageFile;
      }

      this.productService.updateProduct(this.currentProduct.id, updateData).subscribe({
        next: () => {
          this.loadProducts();
          this.closeProductModal();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la modification du produit';
          this.loading = false;
          console.error('Error updating product:', error);
        }
      });
    } else {
      const createData: CreateProductRequest = {
        name: this.productForm.name.trim(),
        description: this.productForm.description.trim(),
        price: this.productForm.price,
        stock_quantity: this.productForm.stock_quantity,
        allergens: this.productForm.allergens.trim(),
        category_id: this.productForm.category_id,
        image: this.selectedImageFile!
      };

      this.productService.createProduct(createData).subscribe({
        next: () => {
          this.loadProducts();
          this.closeProductModal();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la création du produit';
          this.loading = false;
          console.error('Error creating product:', error);
        }
      });
    }
  }

  getStockStatus(quantity: number): string {
    if (quantity === 0) return 'Rupture';
    if (quantity <= 10) return 'Faible';
    return 'Disponible';
  }

  getStockStatusClass(quantity: number): string {
    if (quantity === 0) return 'bg-red-100 text-red-800';
    if (quantity <= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }

  viewProduct(product: Product): void {
    this.currentProduct = product;
    this.showProductDetailsModal = true;
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  closeProductDetailsModal(): void {
    this.showProductDetailsModal = false;
    this.currentProduct = null;
  }

  deleteProduct(product: Product): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?`)) {
      this.loading = true;
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.loadProducts();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors de la suppression du produit';
          this.loading = false;
          console.error('Error deleting product:', error);
        }
      });
    }
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Catégorie inconnue';
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/placeholder.jpg';
  }
}