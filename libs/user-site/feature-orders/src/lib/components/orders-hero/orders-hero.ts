import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HlmBadgeImports } from '@spartan/helm/badge';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucidePackage, lucideTruck, lucideCircleCheck, lucideWallet } from '@ng-icons/lucide';
import { OrdersDataService } from '@invento/user-site-data-access-order';
import { TranslatePipe } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-orders-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    CommonModule,
    CurrencyPipe,
    HlmBadgeImports,
    ...HlmTypographyImports,
    NgIconComponent,
  ],
  providers: [
    provideIcons({
      lucidePackage,
      lucideTruck,
      lucideCircleCheck,
      lucideWallet,
    }),
  ],
  templateUrl: './orders-hero.html',
})
export class OrdersHero {
  protected readonly ordersService = inject(OrdersDataService);
}
