import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmButton } from '@spartan/helm/button';

export interface FilterTab<T extends string = string> {
  id: T;
  label: string;
  /** Optional count pill rendered after the label. */
  count?: number;
}

/**
 * Horizontal row of filter buttons with an active state and optional count pills.
 *
 * Replaces the duplicated `<button>` + `[ngClass]` blocks in `faq` and `orders-filter-bar`.
 * Scrolls horizontally on small screens rather than wrapping, matching the previous
 * behaviour of the orders bar.
 */
@Component({
  selector: 'app-filter-tabs',
  standalone: true,
  imports: [HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      /* Preserved from the deleted orders-filter-bar.css: a slim themed scrollbar for the
         horizontal tab row on mobile, rather than the chunky default. */
      .filter-tabs-scroller {
        scrollbar-color: var(--primary) transparent;
        scrollbar-width: thin;
        /* Reserves the scrollbar's track space up front so a variant swap that nudges a tab's
           width across the overflow threshold doesn't make the scrollbar flash in and out. */
        scrollbar-gutter: stable;
      }
      .filter-tabs-scroller::-webkit-scrollbar {
        height: 6px;
      }
      .filter-tabs-scroller::-webkit-scrollbar-track {
        background: transparent;
      }
      .filter-tabs-scroller::-webkit-scrollbar-thumb {
        background: var(--primary);
        border-radius: 9999px;
        opacity: 0.4;
      }
      .filter-tabs-scroller::-webkit-scrollbar-thumb:hover {
        background: var(--primary);
        opacity: 0.8;
      }
    `,
  ],
  template: `
    <div
      class="filter-tabs-scroller flex min-w-0 items-center gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0"
      role="tablist"
      [attr.aria-label]="ariaLabel()"
    >
      @for (tab of tabs(); track tab.id) {
        <button
          hlmBtn
          type="button"
          size="sm"
          [variant]="tab.id === active() ? 'default' : 'secondary'"
          role="tab"
          [attr.aria-selected]="tab.id === active()"
          class="shrink-0 gap-2 rounded-xl text-xs font-semibold whitespace-nowrap sm:text-sm"
          (click)="tabChange.emit(tab.id)"
        >
          <span>{{ tab.label }}</span>
          @if (tab.count !== undefined) {
            <span
              class="rounded-full px-1.5 py-0.5 text-[11px] font-bold"
              [class]="
                tab.id === active()
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted-foreground/15 text-muted-foreground'
              "
            >
              {{ tab.count }}
            </span>
          }
        </button>
      }
    </div>
  `,
})
export class FilterTabs<T extends string = string> {
  public readonly tabs = input.required<readonly FilterTab<T>[]>();
  public readonly active = input.required<T>();
  public readonly ariaLabel = input<string>('Filters');

  public readonly tabChange = output<T>();
}
