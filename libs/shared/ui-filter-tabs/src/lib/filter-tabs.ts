import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmToggleGroupImports } from '@spartan/helm/toggle-group';
import { HlmBadge } from '@spartan/helm/badge';

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
 *
 * Built on `hlm-toggle-group` rather than `hlm-tabs`: this component only ever filters a list
 * rendered by a sibling component (never a panel it owns), so there is no `tabpanel` for
 * `aria-controls` to point at. `BrnTabsTrigger` emits `aria-controls` unconditionally, which
 * would have produced a dangling reference — a `role="group"` of pressable toggles is the
 * correct, honest a11y shape here (fixes D7: the old markup claimed `role="tab"` without roving
 * tabindex, arrow-key nav or `aria-controls`).
 */
@Component({
  selector: 'app-filter-tabs',
  standalone: true,
  imports: [HlmToggleGroupImports, HlmBadge],
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
    <hlm-toggle-group
      type="single"
      size="sm"
      [nullable]="false"
      [value]="active()"
      (valueChange)="onValueChange($event)"
      [attr.aria-label]="ariaLabel()"
      class="filter-tabs-scroller flex w-full min-w-0 items-center gap-2 overflow-x-auto pb-2 lg:w-auto lg:overflow-x-visible lg:pb-0"
    >
      @for (tab of tabs(); track tab.id) {
        <button
          hlmToggleGroupItem
          [value]="tab.id"
          class="shrink-0 gap-2 rounded-xl text-xs font-semibold whitespace-nowrap sm:text-sm"
          [class]="
            tab.id === active()
              ? 'bg-primary text-primary-foreground hover:bg-primary/80'
              : 'bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]'
          "
        >
          <span>{{ tab.label }}</span>
          @if (tab.count !== undefined) {
            <span
              hlmBadge
              [variant]="tab.id === active() ? 'default' : 'secondary'"
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
    </hlm-toggle-group>
  `,
})
export class FilterTabs<T extends string = string> {
  public readonly tabs = input.required<readonly FilterTab<T>[]>();
  public readonly active = input.required<T>();
  public readonly ariaLabel = input<string>('Filters');

  public readonly tabChange = output<T>();

  protected onValueChange(value: T | readonly T[] | null | undefined): void {
    // `Array.isArray` is typed `(arg: any) => arg is any[]`, so it does not narrow a
    // `readonly T[]` out of this union (see purchase-requests.ts `onStatusChange` for the same
    // trap). `T extends string`, so `typeof` narrows cleanly down to `T` instead.
    if (typeof value === 'string') {
      this.tabChange.emit(value);
    }
  }
}
