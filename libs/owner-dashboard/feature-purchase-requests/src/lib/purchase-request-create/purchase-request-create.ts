import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideX } from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { HlmInput } from '@spartan/helm/input';
import { HlmLabel } from '@spartan/helm/label';
import { HlmTextarea } from '@spartan/helm/textarea';
import {
  HlmSelect,
  HlmSelectContent,
  HlmSelectItem,
  HlmSelectPortal,
  HlmSelectTrigger,
  HlmSelectValue,
} from '@spartan/helm/select';
import { HlmCheckbox } from '@spartan/helm/checkbox';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { HlmSpinner } from '@spartan/helm/spinner';
import {
  HlmDialog,
  HlmDialogContent,
  HlmDialogDescription,
  HlmDialogFooter,
  HlmDialogHeader,
  HlmDialogTitle,
} from '@spartan/helm/dialog';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { ProductService, ApiProductDetail } from '@invento/owner-dashboard-data-access-product';
import { SupplierService, Supplier } from '@invento/owner-dashboard-data-access-supplier';
import {
  PurchaseRequestDetail,
  PurchaseRequestsState,
} from '@invento/owner-dashboard-data-access-purchase-request';

let cachedProducts: ApiProductDetail[] | null = null;
let cachedSuppliers: Supplier[] | null = null;

export function preloadCreateDependencies(
  suppliersApi: SupplierService,
  productsApi: ProductService,
): void {
  if (cachedProducts && cachedSuppliers) {
    return;
  }
  forkJoin({
    suppliers: suppliersApi.list({ page: 1, limit: 100, isActive: true }),
    products: productsApi.getProducts({ page: 1, limit: 100 }),
  }).subscribe({
    next: ({ suppliers, products }) => {
      cachedSuppliers = suppliers.items ?? [];
      const detailRequests: Observable<ApiProductDetail>[] = (products.items ?? []).map((p) =>
        productsApi.getProductById(p.id),
      );
      if (detailRequests.length === 0) {
        cachedProducts = [];
        return;
      }
      forkJoin(detailRequests).subscribe({
        next: (details) => {
          cachedProducts = details.filter((p) => p.variants && p.variants.length > 0);
        },
        error: () => undefined,
      });
    },
    error: () => undefined,
  });
}

@Component({
  selector: 'app-purchase-request-create',
  standalone: true,
  imports: [
    FormsModule,
    NgIcon,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmTextarea,
    HlmSelect,
    HlmSelectTrigger,
    HlmSelectValue,
    HlmSelectContent,
    HlmSelectItem,
    HlmSelectPortal,
    HlmCheckbox,
    HlmSkeleton,
    HlmSpinner,
    HlmDialog,
    HlmDialogContent,
    HlmDialogHeader,
    HlmDialogTitle,
    HlmDialogDescription,
    HlmDialogFooter,
    BrnDialogContent,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucidePlus, lucideX })],
  templateUrl: './purchase-request-create.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseRequestCreate implements OnInit {
  private readonly state = inject(PurchaseRequestsState);
  private readonly suppliersApi = inject(SupplierService);
  private readonly productsApi = inject(ProductService);
  private readonly localeService = inject(LocaleService);

  readonly open = input<boolean>(false);
  readonly created = output<PurchaseRequestDetail>();
  readonly closed = output<void>();

  readonly loading = signal<boolean>(false);
  readonly products = signal<ApiProductDetail[]>([]);
  readonly suppliers = signal<Supplier[]>([]);

  readonly selectedProductId = signal<string>('');
  readonly selectedVariantId = signal<string>('');
  readonly quantity = signal<number>(1);
  readonly deadline = signal<number | null>(null);
  readonly note = signal<string>('');
  readonly selectedSupplierIds = signal<string[]>([]);

  readonly saving = this.state.saving;

  readonly selectedVariantOptions = computed(() => {
    const product = this.products().find((p) => p.id === this.selectedProductId());
    return product?.variants ?? [];
  });

  readonly productItemToString = (id: unknown): string => {
    if (!id || typeof id !== 'string') return '';
    const prod = this.products().find((p) => p.id === id);
    return prod ? prod.title : '';
  };

  readonly variantItemToString = (id: unknown): string => {
    if (!id || typeof id !== 'string') return '';
    let v = this.selectedVariantOptions().find((opt) => opt.id === id);
    if (!v) {
      for (const prod of this.products()) {
        const found = prod.variants.find((opt) => opt.id === id);
        if (found) {
          v = found;
          break;
        }
      }
    }
    return v ? `${v.sku} — ${this.variantLabel(v.attributeValues)}` : '';
  };

  ngOnInit(): void {
    if (cachedProducts && cachedSuppliers) {
      this.products.set(cachedProducts);
      this.suppliers.set(cachedSuppliers);
      this.applyDefaults();
      this.loading.set(false);
      this.loadDependencies(false);
    } else {
      this.loadDependencies(true);
    }
  }

  loadDependencies(showSkeleton = true): void {
    if (showSkeleton) {
      this.loading.set(true);
    }
    forkJoin({
      suppliers: this.suppliersApi.list({ page: 1, limit: 100, isActive: true }),
      products: this.productsApi.getProducts({ page: 1, limit: 100 }),
    }).subscribe({
      next: ({ suppliers, products }) => {
        const activeSuppliers = suppliers.items ?? [];
        cachedSuppliers = activeSuppliers;
        this.suppliers.set(activeSuppliers);

        const detailRequests: Observable<ApiProductDetail>[] = (products.items ?? []).map((p) =>
          this.productsApi.getProductById(p.id),
        );
        if (detailRequests.length === 0) {
          cachedProducts = [];
          this.products.set([]);
          this.applyDefaults();
          this.loading.set(false);
          return;
        }
        forkJoin(detailRequests).subscribe({
          next: (details) => {
            const valid = details.filter((p) => p.variants && p.variants.length > 0);
            cachedProducts = valid;
            this.products.set(valid);
            this.applyDefaults();
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  applyDefaults(): void {
    const prods = this.products();
    if (prods.length > 0 && !this.selectedProductId()) {
      const firstProduct = prods[0];
      this.selectedProductId.set(firstProduct.id);
      const defaultVariant =
        firstProduct.variants.find((v) => v.isDefault) ?? firstProduct.variants[0];
      if (defaultVariant) {
        this.selectedVariantId.set(defaultVariant.id);
      }
    }

    const supps = this.suppliers();
    if (supps.length > 0 && this.selectedSupplierIds().length === 0) {
      this.selectedSupplierIds.set(supps.map((s) => s.id));
    }

    if (this.quantity() < 1) {
      this.quantity.set(1);
    }
  }

  onProductChange(value: unknown): void {
    const id = String(value || '');
    this.selectedProductId.set(id);
    const variants = this.products().find((p) => p.id === id)?.variants ?? [];
    const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0];
    this.selectedVariantId.set(defaultVariant?.id ?? '');
  }

  onVariantChange(value: unknown): void {
    this.selectedVariantId.set(String(value || ''));
  }

  toggleSupplier(id: string): void {
    this.selectedSupplierIds.update((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  selectAllSuppliers(): void {
    this.selectedSupplierIds.set(this.suppliers().map((s) => s.id));
  }

  deselectAllSuppliers(): void {
    this.selectedSupplierIds.set([]);
  }

  variantLabel(values?: { value?: string }[]): string {
    if (!values || !Array.isArray(values) || values.length === 0) {
      return this.localeService.translate('purchase_requests.details_default_variant');
    }
    const labels = values.map((val) => val?.value).filter(Boolean);
    return labels.length > 0
      ? labels.join(', ')
      : this.localeService.translate('purchase_requests.details_default_variant');
  }

  onStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') {
      this.closed.emit();
    }
  }

  onSubmit(): void {
    const variantId = this.selectedVariantId();
    const qty = this.quantity();
    const supplierIds = this.selectedSupplierIds();

    if (!variantId || qty < 1 || supplierIds.length === 0) {
      return;
    }

    this.state.createRequest(
      {
        variantId,
        quantity: qty,
        supplierIds,
        neededWithinDays: this.deadline() || undefined,
        note: this.note().trim() || undefined,
      },
      (detail) => {
        this.created.emit(detail);
        this.closed.emit();
      },
    );
  }

  onCancel(): void {
    this.closed.emit();
  }
}
