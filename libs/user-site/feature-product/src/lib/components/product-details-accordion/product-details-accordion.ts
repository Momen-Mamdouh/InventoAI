import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideFileText,
  lucideSliders,
  lucideTruck,
  lucideShieldCheck,
  lucideRotateCcw,
  lucideClock,
  lucideCheckCircle2,
  lucideSparkles,
  lucideCheck,
} from '@ng-icons/lucide';
import { ProductStore } from '@invento/user-site-data-access-product';
import { HlmTabsImports } from '@spartan/helm/tabs';
import { TranslatePipe } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-product-details-accordion',
  templateUrl: './product-details-accordion.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideFileText,
      lucideSliders,
      lucideTruck,
      lucideShieldCheck,
      lucideRotateCcw,
      lucideClock,
      lucideCheckCircle2,
      lucideSparkles,
      lucideCheck,
    }),
  ],
  imports: [...HlmTabsImports, NgIcon, TranslatePipe],
})
export class ProductDetailsAccordion {
  protected readonly store = inject(ProductStore);

  protected readonly defaultTab = computed(() => {
    const p = this.store.product();
    if (p?.description) {
      return 'details';
    }
    if (p?.specs && p.specs.length > 0) {
      return 'specifications';
    }
    return 'shipping';
  });
}

