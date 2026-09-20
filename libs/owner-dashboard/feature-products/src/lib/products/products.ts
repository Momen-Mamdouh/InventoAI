import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  lucideFolderOpen,
  lucideImage,
  lucideRefreshCw,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { HlmCheckbox } from '@spartan/helm/checkbox';
import { HlmCard } from '@spartan/helm/card';
import { HlmInput } from '@spartan/helm/input';
import {
  HlmSelect,
  HlmSelectContent,
  HlmSelectItem,
  HlmSelectPortal,
  HlmSelectTrigger,
  HlmSelectValue,
} from '@spartan/helm/select';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { HlmSpinner } from '@spartan/helm/spinner';
import {
  HlmTable,
  HlmTBody,
  HlmTd,
  HlmTh,
  HlmTHead,
  HlmTr,
  HlmTableContainer,
} from '@spartan/helm/table';
import { TableHeaderCell, SortDirection, FilterOption } from '@invento/shared-ui-table-header';
import { Pagination } from '@invento/shared-ui-pagination';
import {
  HlmSheet,
  HlmSheetContent,
  HlmSheetFooter,
  HlmSheetHeader,
  HlmSheetPortal,
  HlmSheetTitle,
} from '@spartan/helm/sheet';
import { HlmLabel } from '@spartan/helm/label';
import { HlmTextarea } from '@spartan/helm/textarea';
import { HlmH1, HlmH3, HlmMuted } from '@spartan/helm/typography';
import { HlmTooltip } from '@spartan/helm/tooltip';
import { HlmToggleGroup, HlmToggleGroupItem } from '@spartan/helm/toggle-group';
import { HlmAlert, HlmAlertDescription } from '@spartan/helm/alert';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';

import { forkJoin } from 'rxjs';
import {
  ApiProductListItem,
  PaginatedResponse,
  CreateProductDto,
  CreateProductVariantDto,
  ProductService,
} from '@invento/owner-dashboard-data-access-product';
import { AttributeService } from '@invento/owner-dashboard-data-access-attribute';
import { ProductAttribute } from '@invento/owner-dashboard-data-access-attribute';
import { CategoriesService, Category } from '@invento/owner-dashboard-data-access-category';
import { toast } from '@spartan/helm/sonner';
import { DeleteConfirmDialog } from '@invento/owner-dashboard-ui-confirm-dialog';
import { EmptyState } from '@invento/shared-ui-empty-state';

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
    FormsModule,
    NgIcon,
    HlmButton,
    HlmCard,
    HlmInput,
    HlmSelect,
    HlmSelectContent,
    HlmSelectItem,
    HlmSelectPortal,
    HlmSelectTrigger,
    HlmSelectValue,
    HlmBadge,
    CdkDropList,
    CdkDrag,
    DeleteConfirmDialog,
    HlmSkeleton,
    HlmSpinner,
    HlmTable,
    HlmTBody,
    HlmTd,
    HlmTh,
    HlmTHead,
    HlmTr,
    HlmTableContainer,
    TableHeaderCell,
    Pagination,
    RouterLink,
    HlmSheet,
    HlmSheetContent,
    HlmSheetFooter,
    HlmSheetHeader,
    HlmSheetPortal,
    HlmSheetTitle,
    HlmLabel,
    HlmTextarea,
    HlmH1,
    HlmH3,
    HlmMuted,
    HlmTooltip,
    TranslatePipe,
    HlmCheckbox,
    EmptyState,
    HlmToggleGroup,
    HlmToggleGroupItem,
    HlmAlert,
    HlmAlertDescription,
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
      lucideFolderOpen,
      lucideImage,
      lucideRefreshCw,
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
  private readonly localeService = inject(LocaleService);

  readonly isDrawerOpen = signal(false);
  readonly isBulkDeleteModalOpen = signal(false);
  readonly searchTerm = signal('');

  // Column Header Sort, Search, Filter & Pagination
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly sortColumn = signal<'price' | 'stock' | null>(null);
  readonly sortDirection = signal<SortDirection>(null);
  readonly colSearchTitle = signal<string>('');
  readonly colFilterCategory = signal<string>('');
  readonly colFilterStatus = signal<string>('');

  readonly statusFilterOptions: FilterOption[] = [
    { label: 'Active', value: 'active' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' },
  ];

  readonly categoryFilterOptions = computed<FilterOption[]>(() =>
    this.categories().map((c) => ({ label: c.name, value: c.id })),
  );

  readonly processedProducts = computed(() => {
    let list = [...this.products()];

    // Top-level searchTerm()
    const topQuery = this.searchTerm().trim().toLowerCase();
    if (topQuery) {
      list = list.filter((p) => p.title.toLowerCase().includes(topQuery));
    }

    // Column search: Title
    const titleQuery = this.colSearchTitle().trim().toLowerCase();
    if (titleQuery) {
      list = list.filter((p) => p.title.toLowerCase().includes(titleQuery));
    }

    // Column filter: Category
    const catFilter = this.colFilterCategory();
    if (catFilter) {
      list = list.filter((p) =>
        p.categories?.some(
          (c) => c.id === catFilter || c.name.toLowerCase() === catFilter.toLowerCase(),
        ),
      );
    }

    // Column filter: Status
    const statusFilter = this.colFilterStatus();
    if (statusFilter) {
      list = list.filter((p) => p.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Column sort: Price or Stock
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (col && dir) {
      list.sort((a, b) => {
        let diff = 0;
        if (col === 'price') {
          diff = (a.minPriceAmount ?? 0) - (b.minPriceAmount ?? 0);
        } else if (col === 'stock') {
          diff = (a.totalStock ?? 0) - (b.totalStock ?? 0);
        }
        return dir === 'asc' ? diff : -diff;
      });
    }

    return list;
  });

  readonly totalProductPages = computed(() => {
    const total = this.processedProducts().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  readonly paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.processedProducts().slice(start, start + this.pageSize());
  });

  onSortChange(col: 'price' | 'stock', dir: SortDirection): void {
    this.sortColumn.set(dir ? col : null);
    this.sortDirection.set(dir);
  }

  onTitleSearchChange(q: string): void {
    this.colSearchTitle.set(q);
    this.currentPage.set(1);
  }

  onCategoryFilterChange(val: string): void {
    this.colFilterCategory.set(val);
    this.currentPage.set(1);
  }

  onStatusFilterChange(val: string): void {
    this.colFilterStatus.set(val);
    this.currentPage.set(1);
  }

  onPageChange(p: number): void {
    this.currentPage.set(p);
  }

  resetAllFilters(): void {
    this.searchTerm.set('');
    this.colSearchTitle.set('');
    this.colFilterCategory.set('');
    this.colFilterStatus.set('');
    this.sortColumn.set(null);
    this.sortDirection.set(null);
    this.currentPage.set(1);
  }

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
  readonly errorMessage = signal<string | null>(null);

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

  readonly statusItemToString = (value: unknown): string => {
    const val = String(value).toLowerCase();
    return this.localeService.translate(`products.status_${val}`);
  };

  readonly getAttributeValueLabel = (attrId: string, valId: unknown): string => {
    if (!valId) { return ''; }
    const attr = this.attributes().find((a) => a.id === attrId);
    if (!attr) { return ''; }
    const val = attr.values.find((v) => v.id === valId);
    return val ? val.value : '';
  };

  readonly makeAttributeItemToString = (attrId: string) => {
    return (valId: unknown): string => this.getAttributeValueLabel(attrId, valId);
  };

  createEmptyVariant(): FormVariant {
    const variantAttributeValues: Record<string, string> = {};
    if (this.attributes().length > 0) {
      this.variantAttributes().forEach((a) => {
        const firstVal = a.values && a.values.length > 0 ? a.values[0].id : '';
        variantAttributeValues[a.id] = firstVal;
      });
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

  isCategorySelected(catId: string): boolean {
    return (this.newProduct.categoryIds || []).includes(catId);
  }

  /**
   * `hlm-toggle-group` (type="multiple") emits `T | readonly T[] | null | undefined`.
   * `Array.isArray` is typed `(arg: any) => arg is any[]`, so it does not narrow a
   * `readonly T[]` out of this union — spread into a fresh mutable array instead.
   */
  onCategoriesChange(value: string | readonly string[] | null | undefined): void {
    this.newProduct.categoryIds = Array.isArray(value) ? [...value] : [];
  }

  fetchCategories(): void {
    this.categoriesService.list({ limit: 100 }).subscribe({
      next: (res) => this.categories.set(res.items),
      error: (err: unknown) => console.error('Failed to load categories', err),
    });
  }

  fetchAttributes(): void {
    this.attributeService.getAttributes().subscribe({
      next: (attrs) => {
        this.attributes.set(attrs || []);

        const prodAttrs = { ...this.newProduct.productAttributeValues };
        this.productAttributes().forEach((a) => {
          const firstVal = a.values && a.values.length > 0 ? a.values[0].id : '';
          if (!prodAttrs[a.id]) {
            prodAttrs[a.id] = firstVal;
          }
        });
        this.newProduct.productAttributeValues = prodAttrs;

        this.newProduct.variants.forEach((v) => {
          this.variantAttributes().forEach((a) => {
            const firstVal = a.values && a.values.length > 0 ? a.values[0].id : '';
            if (!v.variantAttributeValues[a.id]) {
              v.variantAttributeValues[a.id] = firstVal;
            }
          });
        });
      },
      error: (err: unknown) => console.error('Failed to load attributes', err),
    });
  }

  fetchProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.productService.getProducts().subscribe({
      next: (response: PaginatedResponse<ApiProductListItem>) => {
        this.products.set(response.items);
        this.totalProducts.set(response.total);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        const msg =
          (err as { error?: { message?: string } })?.error?.message ??
          'products.error_load';
        this.errorMessage.set(msg);
        this.isLoading.set(false);
      },
    });
  }

  goToAttributes(): void {
    this.router.navigate(['/attributes']);
  }

  toggleDrawer(): void {
    if (!this.isDrawerOpen() && this.attributes().length === 0) {
      toast.warning(this.localeService.translate('products.toast_no_attrs'), {
        action: {
          label: this.localeService.translate('products.toast_go_attrs'),
          onClick: () => this.router.navigate(['/attributes']),
        },
      });
      return;
    }

    this.isDrawerOpen.update((v) => !v);
    if (!this.isDrawerOpen()) {
      this.resetNewProduct();
    } else {
      this.fetchAttributes();
    }
  }

  onDrawerStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed' && this.isDrawerOpen()) { this.toggleDrawer(); }
  }

  resetNewProduct(): void {
    const prodAttrs: Record<string, string> = {};
    if (this.attributes().length > 0) {
      this.productAttributes().forEach((a) => {
        const firstVal = a.values && a.values.length > 0 ? a.values[0].id : '';
        prodAttrs[a.id] = firstVal;
      });
    }

    this.newProduct = {
      title: '',
      slug: '',
      description: '',
      shortDescription: '',
      searchKeywords: '',
      status: 'draft',
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
    if (this.attributes().length === 0) {
      toast.error(this.localeService.translate('products.toast_no_attrs'));
      return;
    }

    if (!this.newProduct.title.trim()) {
      toast.error(this.localeService.translate('products.toast_title_required'));
      return;
    }

    if (!this.newProduct.status) {
      toast.error(this.localeService.translate('products.toast_status_required'));
      return;
    }

    if (this.newProduct.variants.length === 0) {
      toast.error(this.localeService.translate('products.toast_variants_required'));
      return;
    }

    const isValid = this.newProduct.variants.every((v) => v.price != null && v.price >= 0);
    if (!isValid) {
      toast.error(this.localeService.translate('products.toast_price_invalid'));
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
        toast.success(this.localeService.translate('products.toast_created'));
        this.isSubmitting.set(false);
        this.toggleDrawer();
        this.fetchProducts();
      },
      error: (err: unknown) => {
        console.error('Failed to create product', err);
        toast.error(this.localeService.translate('products.toast_create_error'));
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
      error: (err: unknown) => {
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
    if (selected.length === 0) { return; }

    this.isBulkActing.set(true);
    const requests = selected.map((id) => this.productService.deleteProduct(id));

    forkJoin(requests).subscribe({
      next: () => {
        toast.success(
          this.localeService.translate('products.toast_deleted', { count: selected.length }),
        );
        this.selectedProductIds.set([]);
        this.fetchProducts();
        this.isBulkActing.set(false);
        this.isBulkDeleteModalOpen.set(false);
      },
      error: (err: unknown) => {
        console.error('Failed to bulk delete products', err);
        toast.error(this.localeService.translate('products.toast_delete_error'));
        this.isBulkActing.set(false);
        this.isBulkDeleteModalOpen.set(false);
        this.fetchProducts();
      },
    });
  }

  bulkUpdateStatus(status: 'draft' | 'active' | 'archived'): void {
    const selected = this.selectedProductIds();
    if (selected.length === 0) { return; }

    this.isBulkActing.set(true);
    const requests = selected.map((id) => this.productService.updateProduct(id, { status }));

    const statusLabel = this.localeService.translate(`products.status_${status}`);

    forkJoin(requests).subscribe({
      next: () => {
        toast.success(
          this.localeService.translate('products.toast_status_updated', {
            count: selected.length,
            status: statusLabel,
          }),
        );
        this.selectedProductIds.set([]);
        this.fetchProducts();
        this.isBulkActing.set(false);
      },
      error: (err: unknown) => {
        console.error('Failed to bulk update products', err);
        toast.error(this.localeService.translate('products.toast_status_error'));
        this.isBulkActing.set(false);
        this.fetchProducts();
      },
    });
  }
}
