import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  OnDestroy,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { switchMap, catchError } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import {
  BreadcrumbTrail,
  ProductGallery,
  ProductSummary,
  VariantSelector,
  PurchaseActions,
  ProductDetailsAccordion,
  RecommendedProducts,
} from '../../components';
import { ProductApiService, ProductStore } from '@invento/user-site-data-access-product';
import { CartService } from '@invento/user-site-data-access-cart';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { HlmSkeletonImports } from '@spartan/helm/skeleton';
import { HlmButton } from '@spartan/helm/button';
import { toast } from '@spartan/helm/sonner';
import { flyToCart } from '../../utils';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlertCircle,
  lucidePackageX,
  lucideShoppingBag,
  lucideShoppingCart,
} from '@ng-icons/lucide';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { StoreSlugService } from '@invento/user-site-data-access-store';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ProductStore,
    provideIcons({
      lucideAlertCircle,
      lucidePackageX,
      lucideShoppingBag,
      lucideShoppingCart,
    }),
  ],
  imports: [
    CurrencyPipe,
    RouterModule,
    NgIcon,
    BreadcrumbTrail,
    ProductGallery,
    ProductSummary,
    VariantSelector,
    PurchaseActions,
    ProductDetailsAccordion,
    RecommendedProducts,
    HlmButton,
    ...HlmSkeletonImports,
    ...HlmTypographyImports,
    TranslatePipe,
  ],
})
export class ProductDetails implements OnInit, OnDestroy {
  /** Multi-tenant: the slug in the URL, not the build-time fallback constant. */
  protected readonly storeSlug = inject(StoreSlugService).slug;

  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(ProductApiService);
  private readonly cartService = inject(CartService);
  private readonly locale = inject(LocaleService);
  protected readonly store = inject(ProductStore);

  public readonly isLoading = signal<boolean>(true);
  public readonly notFound = signal<boolean>(false);

  private sub?: Subscription;

  protected addStickyToCart(event: MouseEvent): void {
    const product = this.store.product();
    const variant = this.store.currentVariant();
    const quantity = this.store.quantity();

    if (!product || !variant) {
      toast.warning(this.locale.translate('product.actions.toast_select_variant'));
      return;
    }

    const variantOptionsMap: Record<string, string> = {};
    if (variant.options) {
      for (const opt of variant.options) {
        variantOptionsMap[opt.attributeName || opt.attributeKey] = opt.value || opt.slug;
      }
    }

    this.cartService.addItem({
      variantId: variant.id,
      productId: product.slug,
      productTitle: product.title,
      productSlug: product.slug,
      productImageUrl: product.images?.[0]?.url || null,
      variantOptions: variantOptionsMap,
      sku: variant.id,
      unitAmount: variant.priceAmount,
      quantity,
    });

    toast.success(
      this.locale.translate('product.actions.toast_added', { quantity, title: product.title }),
    );
    flyToCart(event);
  }

  ngOnInit(): void {
    this.sub = this.route.paramMap
      .pipe(
        switchMap((params) => {
          const productSlug = params.get('id'); // Defined as :id in app.routes.ts, but represents productSlug
          if (!productSlug) {
            return of(null);
          }
          this.isLoading.set(true);
          this.notFound.set(false);
          return this.apiService
            .getProductBySlug(this.storeSlug(), productSlug)
            .pipe(catchError(() => of(null)));
        }),
      )
      .subscribe((product) => {
        if (product) {
          this.store.loadProduct(product);
        } else {
          this.notFound.set(true);
        }
        this.isLoading.set(false);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
