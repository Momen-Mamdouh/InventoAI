import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  input,
  signal,
  effect,
} from '@angular/core';

/**
 * Reconciled from site-builder's fork (T169) — its SVG "N"-mark rendering replaced the earlier
 * stub's CSS-box version, matching the design language `ui-ai-loader` (T167) already adopted from
 * the same source. Class and file renamed to drop the `.component` suffix (Constitution
 * Principle 3); `LoaderComponent` -> `Loader`.
 */
@Component({
  selector: 'app-loader',
  templateUrl: './loader.html',
  styleUrl: './loader.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Loader implements OnDestroy {
  readonly isLoading = input<boolean>(false);
  readonly label = input<string>('Invento AI');
  readonly showLabel = input<boolean>(true);

  // This manages the actual presence in the DOM
  protected readonly showLoader = signal<boolean>(false);

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const loading = this.isLoading();
      if (loading) {
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
          this.timeoutId = null;
        }
        this.showLoader.set(true);
      } else if (this.showLoader()) {
        this.timeoutId = setTimeout(() => {
          this.showLoader.set(false);
          this.timeoutId = null;
        }, 600);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}