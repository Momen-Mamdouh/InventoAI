import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { ProductStore } from '@invento/user-site-data-access-product';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideImage, lucideZoomIn } from '@ng-icons/lucide';
import { TranslatePipe } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-product-gallery',
  imports: [NgIcon, TranslatePipe],
  providers: [provideIcons({ lucideImage, lucideZoomIn })],
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

  protected readonly savingsPercentage = computed(() => {
    const p = this.store.product();
    if (!p) {
      return 0;
    }
    const cv = this.store.currentVariant();
    const price = cv?.priceAmount ?? p.minPriceAmount;
    const compare =
      cv?.compareAtAmount ?? (p.maxPriceAmount > p.minPriceAmount && !cv ? p.maxPriceAmount : null);
    if (!compare || compare <= price) {
      return 0;
    }
    return Math.round(((compare - price) / compare) * 100);
  });

  protected readonly isZoomed = signal(false);
  protected readonly zoomOrigin = signal('center center');

  protected selectImage(index: number): void {
    this._activeIndex.set(index);
    this.isZoomed.set(false);
  }

  protected onMouseEnter(event: MouseEvent): void {
    if (!this.activeImage()) {
      return;
    }
    this.isZoomed.set(true);
    this.updateZoom(event);
  }

  protected onMouseMove(event: MouseEvent): void {
    if (!this.activeImage()) {
      return;
    }
    if (!this.isZoomed()) {
      this.isZoomed.set(true);
    }
    this.updateZoom(event);
  }

  protected onMouseLeave(): void {
    this.isZoomed.set(false);
  }

  private updateZoom(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    this.zoomOrigin.set(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }
}
