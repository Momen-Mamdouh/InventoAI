import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { HlmPaginationImports } from '@spartan/helm/pagination';
import { HlmMuted } from '@spartan/helm/typography';
import { TranslatePipe } from '@invento/shared-util-i18n';

/**
 * Shared page navigator built on Spartan's pagination primitives.
 *
 * Visibility note: `HlmPaginationLink` styles inactive pages as the `ghost` button variant
 * (no background, no border) and the active page as `outline` (border only, no fill). On a
 * plain page background that whole control reads as loose text with no obvious "you are
 * here". We therefore:
 *   - give the active page a solid `bg-primary` fill,
 *   - sit the control on a `bg-card` surface so it reads as one component,
 *   - and show an optional "Showing X-Y of Z" summary, which is what actually tells a
 *     shopper where they are in a long catalogue.
 *
 * Spartan's prev/next already carry `rtl:rotate-180` on their chevrons, so direction
 * flips correctly in Arabic without extra work.
 */
@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmPaginationImports, TranslatePipe, HlmMuted],
  host: { class: 'block' },
})
export class Pagination {
  public readonly currentPage = input.required<number>();
  public readonly totalPages = input.required<number>();
  /** Optional: enables the "Showing X-Y of Z" summary. */
  public readonly totalItems = input<number | undefined>(undefined);
  public readonly pageSize = input<number | undefined>(undefined);
  /** Optional: disables all navigation, e.g. while a page request is in flight. */
  public readonly disabled = input<boolean>(false);

  public readonly pageChange = output<number>();

  protected readonly isFirst = computed(() => this.currentPage() <= 1);
  protected readonly isLast = computed(() => this.currentPage() >= this.totalPages());

  protected readonly summary = computed(() => {
    const total = this.totalItems();
    const size = this.pageSize();
    if (!total || !size) return null;
    const from = (this.currentPage() - 1) * size + 1;
    const to = Math.min(this.currentPage() * size, total);
    return { from, to, total };
  });

  protected readonly pages = computed<(number | string)[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  });

  protected goTo(page: number | string): void {
    if (
      this.disabled() ||
      typeof page === 'string' ||
      page < 1 ||
      page > this.totalPages() ||
      page === this.currentPage()
    ) {
      return;
    }
    this.pageChange.emit(page);
  }
}
