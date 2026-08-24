import { ChangeDetectionStrategy, Component, input, signal, effect } from '@angular/core';

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
export class Loader {
  isLoading = input<boolean>(true);

  // This manages the actual presence in the DOM
  protected showLoader = signal<boolean>(true);

  constructor() {
    // This effect listens for the change in the parent's isLoading signal
    effect(() => {
      if (!this.isLoading()) {
        // Wait for the CSS transition (0.6s) to finish before removing from DOM
        setTimeout(() => {
          this.showLoader.set(false);
        }, 600);
      }
    });
  }
}
