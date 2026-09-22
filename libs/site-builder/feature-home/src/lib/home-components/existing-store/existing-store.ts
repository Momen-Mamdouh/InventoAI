import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLayoutDashboard,
  lucideExternalLink,
  lucidePackage,
  lucideShoppingCart,
  lucideSparkles,
  lucideArrowRight,
  lucideArrowLeft,
  lucideStore,
  lucideInfo,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { HlmH1, HlmP } from '@spartan/helm/typography';
import { TranslatePipe, LocaleService } from '@invento/shared-util-i18n';
import { ScrollAnimateDirective } from '@invento/shared-util-directives';
import { AuthService } from '@invento/shared-data-access-auth';
import { BuilderState } from '@invento/site-builder-data-access-builder';
import { ApiConfig, SITE_BUILDER_ENVIRONMENT } from '@invento/site-builder-data-access-preview';
import { CtaButton } from '@invento/shared-ui-cta-button';
import { SignOutButton } from '@invento/shared-ui-sign-out-button';

@Component({
  selector: 'app-existing-store',
  standalone: true,
  imports: [
    CtaButton,
    SignOutButton,
    NgIcon,
    HlmButton,
    HlmH1,
    HlmP,
    TranslatePipe,
    ScrollAnimateDirective,
  ],
  providers: [
    provideIcons({
      lucideLayoutDashboard,
      lucideExternalLink,
      lucidePackage,
      lucideShoppingCart,
      lucideSparkles,
      lucideArrowRight,
      lucideArrowLeft,
      lucideStore,
      lucideInfo,
    }),
  ],
  templateUrl: './existing-store.html',
  styleUrl: './existing-store.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExistingStore {
  private readonly authService = inject(AuthService);
  private readonly builderState = inject(BuilderState);
  private readonly apiConfig = inject(ApiConfig);
  private readonly environment = inject(SITE_BUILDER_ENVIRONMENT);
  private readonly router = inject(Router);
  private readonly localeService = inject(LocaleService);

  readonly isRtl = this.localeService.isRtl;
  readonly currentUser = this.authService.currentUser;
  readonly ownerName = computed(
    () => this.currentUser()?.firstName || this.builderState.businessName() || '',
  );
  readonly storeSlug = computed(
    () =>
      this.builderState.domain() ||
      this.currentUser()?.storeSlug ||
      this.authService.getStoreSlug() ||
      '',
  );

  readonly dashboardUrl = computed(() =>
    this.authService.getSsoUrl(this.apiConfig.dashboardUrl, '/home'),
  );
  readonly dashboardBaseUrl = computed(() => this.apiConfig.dashboardUrl.replace(/\/home\/?$/, ''));
  readonly catalogUrl = computed(() =>
    this.authService.getSsoUrl(this.dashboardBaseUrl(), '/products'),
  );
  readonly ordersUrl = computed(() =>
    this.authService.getSsoUrl(this.dashboardBaseUrl(), '/orders'),
  );
  readonly advisorUrl = computed(() =>
    this.authService.getSsoUrl(this.dashboardBaseUrl(), '/ai-advisor'),
  );

  readonly storefrontUrl = computed(() => {
    const slug = this.storeSlug();
    if (!slug) {
      return '';
    }
    const storeBase = this.environment.storeBaseUrl;
    if (storeBase) {
      if (storeBase.includes('{slug}')) {
        return storeBase.replace('{slug}', slug);
      }
      return `${storeBase.replace(/\/+$/, '')}/${slug}`;
    }
    return this.environment.production
      ? `https://${slug}.invento.site`
      : `http://localhost:4300/${slug}`;
  });
}
