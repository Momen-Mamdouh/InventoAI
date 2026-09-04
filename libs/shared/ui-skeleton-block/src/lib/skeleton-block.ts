import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmSkeleton } from '@spartan/helm/skeleton';

/**
 * A single shimmering placeholder block.
 *
 * Applies Spartan's `HlmSkeleton` to its own host via `hostDirectives`, so callers pass
 * shape utilities straight through the normal class attribute and Angular merges them with
 * the directive's base styles:
 *
 *     <app-skeleton-block class="h-4 w-3/4 rounded-md" />
 *
 * Note `HlmSkeleton` uses `motion-safe:animate-pulse`, so unlike the raw
 * `animate-pulse` markup this replaces, it respects `prefers-reduced-motion`.
 *
 * Sizing intentionally stays with the caller: every skeleton is shaped like the thing it
 * stands in for, so there is nothing useful to centralise.
 */
@Component({
  selector: 'app-skeleton-block',
  standalone: true,
  hostDirectives: [HlmSkeleton],
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class SkeletonBlock {}
