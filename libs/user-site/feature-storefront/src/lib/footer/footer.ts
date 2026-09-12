import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideFacebook,
  lucideInstagram,
  lucideTwitter,
  lucideMail,
  lucideArrowUp,
} from '@ng-icons/lucide';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmSeparator } from '@spartan/helm/separator';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { StoreService, StoreSlugService } from '@invento/user-site-data-access-store';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgIcon,
    HlmTypographyImports,
    HlmButtonImports,
    HlmSeparator,
    TranslatePipe,
  ],
  providers: [
    provideIcons({
      lucideFacebook,
      lucideInstagram,
      lucideTwitter,
      lucideMail,
      lucideArrowUp,
    }),
  ],
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly storeService = inject(StoreService);

  /** Shared with the navbar, home and every product card, so they cannot drift apart. */
  protected readonly activeStoreSlug = inject(StoreSlugService).slug;

  protected readonly year = new Date().getFullYear();

  public readonly showBackToTop = signal<boolean>(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.showBackToTop.set(window.scrollY > 200);
    }
  }

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

  protected scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
