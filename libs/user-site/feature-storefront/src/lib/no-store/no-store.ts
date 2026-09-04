import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideStore } from '@ng-icons/lucide';
import { EmptyState } from '@invento/shared-ui-empty-state';
import { TranslatePipe } from '@invento/shared-util-i18n';

/**
 * Shown when the URL names no store.
 *
 * Bare `/` used to redirect to a slug baked into `environment.storeSlug`. That guessed a
 * tenant the database may not have — after a reseed replaced the seeded store, every visit
 * to `/` produced a cascade of 404s against a store that no longer existed. There is no
 * public endpoint that can answer "which store?" (every public route is `site/:slug/...`),
 * so the honest response to a missing slug is to say so rather than invent one.
 *
 * In production this page is effectively unreachable: a storefront is served from its own
 * subdomain, which `StoreSlugService` resolves before the router ever sees a bare path.
 */
@Component({
  selector: 'app-no-store',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, TranslatePipe],
  // `EmptyState` renders an `ng-icon` but registers no icons itself, so the consumer must
  // provide them — without this the icon silently rendered as nothing.
  providers: [provideIcons({ lucideStore })],
  template: `
    <div class="bg-background text-foreground flex min-h-screen items-center justify-center px-4">
      <app-empty-state
        class="block max-w-md"
        icon="lucideStore"
        [title]="'no_store.title' | translate"
        [description]="'no_store.description' | translate"
      />
    </div>
  `,
})
export class NoStore {}
