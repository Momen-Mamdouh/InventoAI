import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EmptyState } from '@invento/shared';
import { TranslatePipe } from '@invento/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideStore, lucideRefreshCw } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan/helm/button';
import { StoreService } from '@invento/user-site/app/core/service/store.service';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';

/**
 * Shown when the slug in the URL/host resolved to no store (`GET /site/:slug` failed).
 *
 * Reached via `storeGuard` on the `:storeSlug` route rather than the router falling through
 * to `HomeComponent` — an unknown slug used to render the home page, which then fired a
 * doomed request and left the navbar on a permanent skeleton. See `no-store.ts` for the
 * sibling case (no slug at all).
 */
@Component({
  selector: 'app-store-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, TranslatePipe, NgIcon, HlmButtonImports],
  providers: [provideIcons({ lucideStore, lucideRefreshCw })],
  template: `
    <div class="bg-background text-foreground flex min-h-screen items-center justify-center px-4">
      <app-empty-state
        class="block max-w-md"
        icon="lucideStore"
        [title]="'store_not_found.title' | translate"
        [description]="'store_not_found.description' | translate"
      >
        <button hlmBtn (click)="retry()">
          <ng-icon name="lucideRefreshCw" size="16" class="me-2" />
          {{ 'store_not_found.retry' | translate }}
        </button>
      </app-empty-state>
    </div>
  `,
})
export class StoreNotFoundComponent {
  private readonly storeService = inject(StoreService);
  private readonly storeSlugService = inject(StoreSlugService);

  protected retry(): void {
    const slug = this.storeSlugService.slug();
    if (!slug) return;
    this.storeService.retry(slug);
  }
}
