import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoader2, lucideSparkles, lucideStore } from '@ng-icons/lucide';
import { TranslatePipe } from '@invento/shared-util-i18n';
import {
  StoreLoaderService,
  StoreService,
  StoreSlugService,
} from '@invento/user-site-data-access-store';

@Component({
  selector: 'app-store-loader',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  providers: [provideIcons({ lucideSparkles, lucideStore, lucideLoader2 })],
  templateUrl: './store-loader.html',
  styleUrl: './store-loader.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreLoader {
  protected readonly loaderService = inject(StoreLoaderService);
  protected readonly storeService = inject(StoreService);
  protected readonly storeSlugService = inject(StoreSlugService);

  /** Active store display name fallback to capitalized slug */
  protected readonly storeName = computed(() => {
    const name = this.storeService.displayName();
    if (name) {
      return name;
    }
    const slug = this.storeSlugService.slug();
    if (slug) {
      return slug.charAt(0).toUpperCase() + slug.slice(1);
    }
    return '';
  });

  /** Store logo URL */
  protected readonly logoUrl = computed(() => this.storeService.logoUrl());

  /** Store monogram */
  protected readonly monogram = computed(() => {
    const mono = this.storeService.monogram();
    if (mono) {
      return mono;
    }
    const slug = this.storeSlugService.slug();
    if (slug) {
      return slug.slice(0, 2).toUpperCase();
    }
    return 'IA';
  });

  /** Whether the store context is resolved */
  protected readonly hasStoreContext = computed(() => {
    return Boolean(this.storeSlugService.slug());
  });
}
