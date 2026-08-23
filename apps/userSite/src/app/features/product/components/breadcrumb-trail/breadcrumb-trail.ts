import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProductStore } from '../../services';
import { HlmBreadcrumbImports } from '@spartan/helm/breadcrumb';
import { hlmUl } from '@spartan/helm/typography';
import { RouterModule } from '@angular/router';

import { TranslatePipe } from '@invento/shared-util-i18n';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';

@Component({
  selector: 'app-breadcrumb-trail',
  templateUrl: './breadcrumb-trail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmBreadcrumbImports, RouterModule, TranslatePipe],
})
export class BreadcrumbTrail {
  protected readonly hlmUl = hlmUl;
  protected readonly store = inject(ProductStore);
  /** Multi-tenant: the slug in the URL, not the build-time fallback constant. */
  protected readonly storeSlug = inject(StoreSlugService).slug;
}
