import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { ProductStore } from '@invento/user-site-data-access-product';
import { HlmCarouselImports } from '@spartan/helm/carousel';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideImage } from '@ng-icons/lucide';
import { TranslatePipe } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-product-gallery',
  imports: [HlmCarouselImports, NgIcon, TranslatePipe],
  providers: [provideIcons({ lucideImage })],
  templateUrl: './product-gallery.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGallery {
  protected readonly store = inject(ProductStore);
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly isDesktop = toSignal(
    this.breakpointObserver.observe('(min-width: 768px)').pipe(map((result) => result.matches)),
    { initialValue: true },
  );

  private readonly _activeIndex = signal(0);
  protected readonly activeIndex = this._activeIndex.asReadonly();
  protected readonly activeImage = computed(
    () => this.store.product()?.images[this._activeIndex()] ?? null,
  );

  protected readonly isZoomed = signal(false);
  protected readonly zoomOrigin = signal('center center');

  protected selectImage(index: number): void {
    this._activeIndex.set(index);
  }

  protected onMouseMove(event: MouseEvent): void {
    if (!this.isDesktop()) return; // Disable zoom on mobile
    this.isZoomed.set(true);
    const target = event.currentTarget as HTMLElement;
    const { left, top, width, height } = target.getBoundingClientRect();
    const x = ((event.clientX - left) / width) * 100;
    const y = ((event.clientY - top) / height) * 100;
    this.zoomOrigin.set(`${x}% ${y}%`);
  }

  protected onMouseLeave(): void {
    this.isZoomed.set(false);
  }
}
