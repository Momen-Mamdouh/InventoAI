import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';

import { StorefrontHome, StorefrontHomeProduct } from '@invento/shared-ui-storefront-home';
import { StoreService, StoreSlugService } from '@invento/user-site-data-access-store';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StorefrontHome],
  templateUrl: './home.html',
})
export class Home {
  protected readonly storeService = inject(StoreService);
  private readonly storeSlugService = inject(StoreSlugService);
  private readonly router = inject(Router);

  protected readonly storeSlug = this.storeSlugService.slug;

  protected readonly hero = this.storeService.hero;
  protected readonly categories = this.storeService.featuredCategories;
  protected readonly products = this.storeService.featuredProducts;

  protected readonly isLoading = this.storeService.isLoading;
  protected readonly error = this.storeService.error;

  protected readonly storeName = computed(() => this.storeService.displayName());
  protected readonly storeDescription = computed(() =>
    (this.storeService.store()?.description ?? '').trim(),
  );
  protected readonly storeCurrency = computed(
    () => this.storeService.store()?.currency || 'USD',
  );

  constructor() {
    effect(() => this.storeService.load(this.storeSlug()));
  }

  protected retry(): void {
    this.storeService.retry(this.storeSlug());
  }

  protected onAddToCart(product: StorefrontHomeProduct): void {
    const slug = product.slug || product.id;
    if (slug) {
      this.router.navigate(['/', this.storeSlug(), 'product-details', slug]);
    }
  }
}
