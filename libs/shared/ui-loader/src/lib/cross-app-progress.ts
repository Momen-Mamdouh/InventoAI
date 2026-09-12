import { ChangeDetectionStrategy, Component, inject, ChangeDetectorRef, effect } from '@angular/core';
import { CrossAppNavService } from './cross-app-nav.service';
import { NetworkService } from '@invento/shared-util-environment';

/**
 * Global application overlay managing:
 * 1. Indeterminate progress bar displayed strictly during cross-application transitions.
 * 2. Visual sticky top banner when the device loses network connectivity.
 */
@Component({
  selector: 'app-cross-app-progress',
  standalone: true,
  template: `
    @if (navService.isNavigating()) {
      <div
        class="fixed top-0 inset-x-0 z-[9999] h-[2.5px] pointer-events-none overflow-hidden bg-primary/20"
        role="progressbar"
        aria-label="Cross-application navigation progress"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="cross-app-bar h-full bg-primary shadow-[0_0_8px_var(--primary)]"></div>
      </div>
    }

    @if (!networkService.isOnline()) {
      <div
        class="fixed top-0 inset-x-0 z-[9998] py-1.5 px-4 bg-amber-500/95 text-amber-950 dark:bg-amber-600/95 dark:text-amber-50 text-xs font-medium backdrop-blur-md shadow-xs flex items-center justify-center gap-2 select-none pointer-events-auto"
        role="status"
        aria-live="polite"
      >
        <span class="inline-block w-2 h-2 rounded-full bg-amber-900 dark:bg-amber-100 animate-pulse"></span>
        <span>You are currently offline. Real-time actions will resume once reconnected.</span>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .cross-app-bar {
      width: 100%;
      animation: crossAppIndeterminate 1.4s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
      transform-origin: 0% 50%;
    }

    @keyframes crossAppIndeterminate {
      0% {
        transform: translateX(-100%) scaleX(0.2);
      }
      50% {
        transform: translateX(0%) scaleX(0.7);
      }
      100% {
        transform: translateX(100%) scaleX(0.2);
      }
    }

    :host-context([dir='rtl']) .cross-app-bar {
      animation-name: crossAppIndeterminateRtl;
      transform-origin: 100% 50%;
    }

    @keyframes crossAppIndeterminateRtl {
      0% {
        transform: translateX(100%) scaleX(0.2);
      }
      50% {
        transform: translateX(0%) scaleX(0.7);
      }
      100% {
        transform: translateX(-100%) scaleX(0.2);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .cross-app-bar {
        animation: none;
        width: 100%;
        transform: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrossAppProgress {
  protected readonly navService = inject(CrossAppNavService);
  protected readonly networkService = inject(NetworkService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      this.navService.isNavigating();
      this.networkService.isOnline();
      this.cdr.markForCheck();
    });
  }
}
