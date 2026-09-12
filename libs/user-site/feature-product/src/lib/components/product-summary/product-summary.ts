import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HlmBadge } from '@spartan/helm/badge';
import { ProductStore } from '@invento/user-site-data-access-product';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { StoreSlugService } from '@invento/user-site-data-access-store';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheckCircle2,
  lucideFlame,
  lucideBan,
  lucideTruck,
  lucideShieldCheck,
  lucideRotateCcw,
  lucideTag,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-product-summary',
  templateUrl: './product-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    RouterModule,
    TranslatePipe,
    HlmBadge,
    NgIcon,
    ...HlmTypographyImports,
  ],
  providers: [
    provideIcons({
      lucideCheckCircle2,
      lucideFlame,
      lucideBan,
      lucideTruck,
      lucideShieldCheck,
      lucideRotateCcw,
      lucideTag,
    }),
  ],
})
export class ProductSummary {
  protected readonly store = inject(ProductStore);
  protected readonly storeSlug = inject(StoreSlugService).slug;
}
