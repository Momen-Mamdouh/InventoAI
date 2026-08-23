import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFacebook, lucideInstagram, lucideTwitter, lucideMail } from '@ng-icons/lucide';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { StoreService } from '@invento/user-site/app/core/service/store.service';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgIcon, HlmTypographyImports, TranslatePipe],
  providers: [provideIcons({ lucideFacebook, lucideInstagram, lucideTwitter, lucideMail })],
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly storeService = inject(StoreService);

  /** Shared with the navbar, home and every product card, so they cannot drift apart. */
  protected readonly activeStoreSlug = inject(StoreSlugService).slug;

  protected readonly year = new Date().getFullYear();

  /** Gates the social row so no empty flex container with margin is left behind. */
  protected readonly hasSocialLinks = computed(() => {
    const social = this.storeService.social();
    return !!(
      social?.facebook ||
      social?.instagram ||
      social?.twitter ||
      this.storeService.contactEmail()
    );
  });
}
