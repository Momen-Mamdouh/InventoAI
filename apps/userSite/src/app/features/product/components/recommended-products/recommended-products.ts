import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  OnDestroy,
} from '@angular/core';
import { HlmCarouselImports } from '@spartan/helm/carousel';
import { ProductCard } from '../product-card/product-card';
import { ProductApiService } from '../../services';
import { ProductListItem } from '../../types';
import { Subscription } from 'rxjs';
import { HlmTypographyImports } from '@spartan/helm/typography';

import { TranslatePipe } from '@invento/core';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';

@Component({
  selector: 'app-recommended-products',
  templateUrl: './recommended-products.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HlmCarouselImports, ProductCard, ...HlmTypographyImports, TranslatePipe],
})
export class RecommendedProducts implements OnInit, OnDestroy {
  /** Multi-tenant: the slug in the URL, not the build-time fallback constant. */
  protected readonly storeSlug = inject(StoreSlugService).slug;

  private readonly apiService = inject(ProductApiService);

  public readonly products = signal<ProductListItem[]>([]);
  private sub?: Subscription;

  ngOnInit(): void {
    // Fetch top 10 rated or default products to show as recommended
    this.sub = this.apiService.getProducts(this.storeSlug(), { limit: 10 }).subscribe((res) => {
      this.products.set(res.items);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
