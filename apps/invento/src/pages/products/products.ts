import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideDownload,
  lucideSearch,
  lucideChevronRight,
  lucidePlus,
  lucideX,
  lucideAlertCircle,
  lucideLoader2,
  lucideCheck,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmSelectImports } from '@spartan/helm/select';
import { HlmBadgeImports } from '@spartan/helm/badge';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';

import { forkJoin } from 'rxjs';
import {
  ApiProductListItem,
  PaginatedResponse,
  CreateProductDto,
  CreateProductVariantDto,
} from '../../features/products/product.model';
import { ProductService } from '../../features/products/product.service';
import { AttributeService } from '../../features/attributes/attribute.service';
import { ProductAttribute } from '../../features/attributes/attribute.model';
import { CategoriesService } from '../../features/categories/category.service';
import { Category } from '../../features/categories/category.model';
import { toast } from '@spartan-ng/brain/sonner';
import { DeleteConfirmDialog } from '../categories/delete-confirm-dialog';
import { SearchPipe } from '../../shared/pipes/search.pipe';

interface FormVariant {
  sku: string;
  price: number | null;
  compareAtAmount: number | null;
  stock: number | null;
  lowStockThreshold: number | null;
  variantAttributeValues: Record<string, string>; // map of attribute.id -> value.id
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    NgClass,
    FormsModule,
    NgIcon,
    HlmButton,
    HlmCardImports,
    HlmInputImports,
    HlmSelectImports,
    HlmBadgeImports,
    CdkDropList,
    CdkDrag,
    DeleteConfirmDialog,
    SearchPipe,
    HlmSkeleton,
  ],
  providers: [
    provideIcons({
      lucideDownload,
      lucideSearch,
      lucideChevronRight,
      lucidePlus,
      lucideX,
      lucideAlertCircle,
      lucideLoader2,
      lucideCheck,
    }),
  ],
  templateUrl: './products.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Products implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly attributeService = inject(AttributeService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly router = inject(Router);

  readonly isDrawerOpen = signal(false);
  readonly isBulkDeleteModalOpen = signal(false);
  readonly searchTerm = signal('');

  readonly selectedProductIds = signal<string[]>([]);
  readonly isAllSelected = computed(() => {
    const products = this.products();
    const selected = this.selectedProductIds();
    return products.length > 0 && selected.length === products.length;
  });
  readonly isBulkActing = signal(false);

  readonly products = signal<ApiProductListItem[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly totalProducts = signal<number>(0);

  readonly attributes = signal<ProductAttribute[]>([]);
  readonly variantAttributes = computed(() => this.attributes().filter((a) => a.isVariantAxis));
  readonly productAttributes = computed(() => this.attributes().filter((a) => !a.isVariantAxis));

  readonly categories = signal<Category[]>([]);

  // New product form model
  newProduct = {
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    searchKeywords: '',
    status: 'draft' as 'draft' | 'active' | 'archived',
    isFeatured: false,
    weightGrams: null as number | null,
    categoryIds: [] as string[],
    productAttributeValues: {} as Record<string, string>,
    variants: [this.createEmptyVariant()],
  };
  isSubmitting = signal(false);

  private readonly statusLabels: Record<string, string> = {
    draft: 'Draft',
    active: 'Active',
    archived: 'Archived',
  };

  readonly statusItemToString = (value: unknown): string => {
    return this.statusLabels[String(value).toLowerCase()] ?? 'Draft';
  };

  readonly getAttributeValueLabel = (attrId: string, valId: unknown): string => {
    if (!valId) return '';
    const attr = this.attributes().find((a) => a.id === attrId);
    if (!attr) return '';
    const val = attr.values.find((v) => v.id === valId);
    return val ? val.value : '';
  };

  readonly makeAttributeItemToString = (attrId: string) => {
    return (valId: unknown): string => this.getAttributeValueLabel(attrId, valId);
  };

  createEmptyVariant(): FormVariant {
    const variantAttributeValues: Record<string, string> = {};
    if (this.attributes().length > 0) {
      this.variantAttributes().forEach((a) => (variantAttributeValues[a.id] = ''));
    }
    return {
      sku: '',
      price: null,
      compareAtAmount: null,
      stock: null,
      lowStockThreshold: null,
      variantAttributeValues,
    };
  }

  ngOnInit(): void {
    this.fetchProducts();
    this.fetchAttributes();
    this.fetchCategories();
  }

  toggleCategory(catId: string): void {
    const ids = this.newProduct.categoryIds || [];
    if (ids.includes(catId)) {
      this.newProduct.categoryIds = ids.filter((id) => id !== catId);
    } else {
      this.newProduct.categoryIds = [...ids, catId];
    }
  }

  isCategorySelected(catId: string): boolean {
    return (this.newProduct.categoryIds || []).includes(catId);
  }

  fetchCategories(): void {
    this.categoriesService.list({ limit: 100 }).subscribe({
      next: (res) => this.categories.set(res.items),
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  fetchAttributes(): void {
    this.attributeService.getAttributes().subscribe({
      next: (attrs) => {
        this.attributes.set(attrs);

        const prodAttrs = { ...this.newProduct.productAttributeValues };
        this.productAttributes().forEach((a) => {
          if (prodAttrs[a.id] === undefined) prodAttrs[a.id] = '';
        });
        this.newProduct.productAttributeValues = prodAttrs;

        this.newProduct.variants.forEach((v) => {
          this.variantAttributes().forEach((a) => {
            if (v.variantAttributeValues[a.id] === undefined) v.variantAttributeValues[a.id] = '';
          });
        });
      },
      error: (err) => console.error('Failed to load attributes', err),
    });
  }

  fetchProducts(): void {
    this.isLoading.set(true);

    this.productService.getProducts().subscribe({
      next: (response: PaginatedResponse<ApiProductListItem>) => {
        this.products.set(response.items);
        this.totalProducts.set(response.total);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error('Failed to load products', err);
        this.isLoading.set(false);
      },
    });
  }

  toggleDrawer(): void {
    this.isDrawerOpen.update((v) => !v);
    if (!this.isDrawerOpen()) {
      this.resetNewProduct();
    }
  }

  resetNewProduct(): void {
    const prodAttrs: Record<string, string> = {};
    if (this.attributes().length > 0) {
      this.productAttributes().forEach((a) => (prodAttrs[a.id] = ''));
    }

    this.newProduct = {
      title: '',
      slug: '',
      description: '',
      shortDescription: '',
      searchKeywords: '',
      status: '' as 'draft' | 'active' | 'archived',
      isFeatured: false,
      weightGrams: null,
      categoryIds: [],
      productAttributeValues: prodAttrs,
      variants: [this.createEmptyVariant()],
    };
  }

  addVariant(): void {
    this.newProduct.variants.push(this.createEmptyVariant());
  }

  removeVariant(index: number): void {
    if (this.newProduct.variants.length > 1) {
      this.newProduct.variants.splice(index, 1);
    }
  }

  submitProduct(): void {
    if (!this.newProduct.title.trim()) {
      toast.error('Product title is required.');
      return;
    }

    if (!this.newProduct.status) {
      toast.error('Product status is required.');
      return;
    }

    if (this.newProduct.variants.length === 0) {
      toast.error('At least one variant is required.');
      return;
    }

    const isValid = this.newProduct.variants.every((v) => v.price != null && v.price >= 0);
    if (!isValid) {
      toast.error('All variants must have a valid non-negative price.');
      return;
    }

    this.isSubmitting.set(true);

    const apiVariants: CreateProductVariantDto[] = this.newProduct.variants.map((v) => {
      const attributeValueIds = Object.values(v.variantAttributeValues).filter((val) => !!val);

      return {
        sku: v.sku,
        priceAmount: Math.round((v.price ?? 0) * 100), // convert to minor units
        compareAtAmount:
          v.compareAtAmount != null ? Math.round(v.compareAtAmount * 100) : undefined,
        stockQuantity: v.stock ?? 0,
        lowStockThreshold: v.lowStockThreshold ?? 0,
        attributeValueIds: attributeValueIds.length > 0 ? attributeValueIds : undefined,
      };
    });

    const rootAttributeValueIds = Object.values(this.newProduct.productAttributeValues).filter(
      (val) => !!val,
    );

    const payload: CreateProductDto = {
      title: this.newProduct.title,
      slug: this.newProduct.slug || undefined,
      description: this.newProduct.description || undefined,
      shortDescription: this.newProduct.shortDescription || undefined,
      status: this.newProduct.status,
      isFeatured: this.newProduct.isFeatured,
      weightGrams: this.newProduct.weightGrams || undefined,
      categoryIds: this.newProduct.categoryIds.length > 0 ? this.newProduct.categoryIds : undefined,
      attributeValueIds: rootAttributeValueIds.length > 0 ? rootAttributeValueIds : undefined,
      variants: apiVariants,
    };

    this.productService.createProduct(payload).subscribe({
      next: () => {
        toast.success('Product created successfully');
        this.isSubmitting.set(false);
        this.toggleDrawer();
        this.fetchProducts(); // refresh the list
      },
      error: (err) => {
        console.error('Failed to create product', err);
        toast.error('Failed to create product');
        this.isSubmitting.set(false);
      },
    });
  }

  drop(event: CdkDragDrop<ApiProductListItem[]>): void {
    const currentProducts = [...this.products()];
    moveItemInArray(currentProducts, event.previousIndex, event.currentIndex);
    this.products.set(currentProducts);

    // Save reorder
    const items = currentProducts.map((p, i) => ({ id: p.id, position: i }));
    this.productService.reorderProducts(items).subscribe({
      error: (err) => {
        console.error('Failed to save order', err);
        this.fetchProducts(); // revert on error
      },
    });
  }

  viewProductDetails(id: string): void {
    this.router.navigate(['/products', id]);
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedProductIds.set([]);
    } else {
      this.selectedProductIds.set(this.products().map((p) => p.id));
    }
  }

  toggleSelect(id: string): void {
    const selected = this.selectedProductIds();
    if (selected.includes(id)) {
      this.selectedProductIds.set(selected.filter((sId) => sId !== id));
    } else {
      this.selectedProductIds.set([...selected, id]);
    }
  }

  openBulkDeleteModal(): void {
    if (this.selectedProductIds().length > 0) {
      this.isBulkDeleteModalOpen.set(true);
    }
  }

  bulkDelete(): void {
    const selected = this.selectedProductIds();
    if (selected.length === 0) return;

    this.isBulkActing.set(true);
    const requests = selected.map((id) => this.productService.deleteProduct(id));

    forkJoin(requests).subscribe({
      next: () => {
        toast.success(`Deleted ${selected.length} products successfully.`);
        this.selectedProductIds.set([]);
        this.fetchProducts();
        this.isBulkActing.set(false);
        this.isBulkDeleteModalOpen.set(false);
      },
      error: (err) => {
        console.error('Failed to bulk delete products', err);
        toast.error('Failed to delete some or all products.');
        this.isBulkActing.set(false);
        this.isBulkDeleteModalOpen.set(false);
        this.fetchProducts();
      },
    });
  }

  bulkUpdateStatus(status: 'draft' | 'active' | 'archived'): void {
    const selected = this.selectedProductIds();
    if (selected.length === 0) return;

    this.isBulkActing.set(true);
    const requests = selected.map((id) => this.productService.updateProduct(id, { status }));

    forkJoin(requests).subscribe({
      next: () => {
        toast.success(`Updated status of ${selected.length} products to ${status}.`);
        this.selectedProductIds.set([]);
        this.fetchProducts();
        this.isBulkActing.set(false);
      },
      error: (err) => {
        console.error('Failed to bulk update products', err);
        toast.error('Failed to update status for some or all products.');
        this.isBulkActing.set(false);
        this.fetchProducts();
      },
    });
  }
}
