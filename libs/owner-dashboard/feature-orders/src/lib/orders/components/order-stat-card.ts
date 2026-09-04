import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmCard } from '@spartan/helm/card';
import { HlmBadge } from '@spartan/helm/badge';
import {
  lucideTrendingUp,
  lucideTrendingDown,
  lucideMinus,
  lucideShoppingCart,
  lucideClock,
  lucideRefreshCw,
  lucideCheckCircle2,
  lucideXCircle,
  lucidePackage,
  lucideTruck,
} from '@ng-icons/lucide';

export type StatCardColorVariant = 'indigo' | 'amber' | 'sky' | 'emerald' | 'rose';

@Component({
  selector: 'app-order-stat-card',
  imports: [NgIcon, HlmCard, HlmBadge],
  providers: [
    provideIcons({
      lucideTrendingUp,
      lucideTrendingDown,
      lucideMinus,
      lucideShoppingCart,
      lucideClock,
      lucideRefreshCw,
      lucideCheckCircle2,
      lucideXCircle,
      lucidePackage,
      lucideTruck,
    }),
  ],
  template: `
    <div
      hlmCard
      class="group relative overflow-hidden border border-border/80 p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md h-full flex flex-col justify-between"
      [class]="cardBorderClass()"
    >
      <!-- Ambient background glow -->
      <div
        class="absolute -end-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-15 transition-opacity duration-500 group-hover:opacity-35 pointer-events-none"
        [class]="glowClass()"
      ></div>

      <div>
        <!-- Top Row: Title & Icon -->
        <div class="flex items-center justify-between gap-2 sm:gap-3">
          <span
            class="text-xs sm:text-sm font-medium text-muted-foreground tracking-tight truncate"
          >
            {{ title() }}
          </span>
          <div
            class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-105 shrink-0"
            [class]="iconBoxClass()"
          >
            <ng-icon [name]="iconName()" size="17" />
          </div>
        </div>

        <!-- Middle Row: Value -->
        <div class="mt-2 sm:mt-3 flex items-baseline justify-between">
          <span
            class="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono truncate"
          >
            {{ value() }}
          </span>
        </div>
      </div>

      <!-- Optional Bottom Row (only rendered if subtitle or trend value provided) -->
      @if (trendValue() || trendSubtitle()) {
        <div class="mt-2.5 flex items-center gap-1.5 text-[11px] sm:text-xs">
          @if (trendValue()) {
            <span
              hlmBadge
              variant="outline"
              class="font-semibold"
              [class]="trendBadgeClass()"
            >
              @switch (trend()) {
                @case ('up') {
                  <ng-icon name="lucideTrendingUp" size="12" />
                }
                @case ('down') {
                  <ng-icon name="lucideTrendingDown" size="12" />
                }
                @default {
                  <ng-icon name="lucideMinus" size="12" />
                }
              }
              <span>{{ trendValue() }}</span>
            </span>
          }
          @if (trendSubtitle()) {
            <span class="text-muted-foreground font-medium truncate">{{ trendSubtitle() }}</span>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStatCard {
  readonly title = input.required<string>();
  readonly value = input.required<string | number>();
  readonly iconName = input.required<string>();
  readonly trend = input<'up' | 'down' | 'neutral'>('neutral');
  readonly trendValue = input<string>('');
  readonly trendSubtitle = input<string>('');
  readonly colorVariant = input<StatCardColorVariant>('indigo');

  readonly cardBorderClass = computed(() => {
    switch (this.colorVariant()) {
      case 'amber':
        return 'hover:border-amber-500/50 hover:shadow-amber-500/5';
      case 'sky':
        return 'hover:border-sky-500/50 hover:shadow-sky-500/5';
      case 'emerald':
        return 'hover:border-emerald-500/50 hover:shadow-emerald-500/5';
      case 'rose':
        return 'hover:border-rose-500/50 hover:shadow-rose-500/5';
      case 'indigo':
      default:
        return 'hover:border-indigo-500/50 hover:shadow-indigo-500/5';
    }
  });

  readonly glowClass = computed(() => {
    switch (this.colorVariant()) {
      case 'amber':
        return 'bg-amber-500';
      case 'sky':
        return 'bg-sky-500';
      case 'emerald':
        return 'bg-emerald-500';
      case 'rose':
        return 'bg-rose-500';
      case 'indigo':
      default:
        return 'bg-indigo-500';
    }
  });

  readonly iconBoxClass = computed(() => {
    switch (this.colorVariant()) {
      case 'amber':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60';
      case 'sky':
        return 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60';
      case 'rose':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60';
      case 'indigo':
      default:
        return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60';
    }
  });

  readonly trendBadgeClass = computed(() => {
    switch (this.trend()) {
      case 'up':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'down':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
      case 'neutral':
      default:
        return 'bg-muted/60 text-muted-foreground border-border';
    }
  });
}
