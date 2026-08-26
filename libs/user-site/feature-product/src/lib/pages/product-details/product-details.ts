import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { HlmTypographyImports } from '@spartan/helm/typography';
import { HlmSpinner } from '@spartan/helm/spinner';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAlertCircle } from '@ng-icons/lucide';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { StoreSlugService } from '@invento/user-site-data-access-store';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProductStore, provideIcons({ lucideAlertCircle })],
  imports: [
    HlmSpinner,
    BreadcrumbTrail,
    ProductGallery,
    ProductSummary,
    VariantSelector,
    PurchaseActions,
    ProductDetailsAccordion,
    RecommendedProducts,
    HlmTypographyImports,
    NgIcon,
    TranslatePipe,
  ],
})
export class ProductDetails implements OnInit, OnDestroy {
  /** Multi-tenant: the slug in the URL, not the build-time fallback constant. */
  protected readonly storeSlug = inject(StoreSlugService).slug;

  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(ProductApiService);
  protected readonly store = inject(ProductStore);

  public readonly isLoading = signal<boolean>(true);
  public readonly notFound = signal<boolean>(false);

  private sub?: Subscription;

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
