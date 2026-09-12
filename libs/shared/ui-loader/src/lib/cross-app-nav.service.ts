import { inject, Injectable, NgZone, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Service managing cross-app navigation states.
 *
 * Listens for user clicks on cross-app or cross-origin links and triggers an
 * indeterminate top loading bar while the browser initiates the full document
 * transition to the destination application.
 *
 * Normal in-app SPA route transitions handled by Angular's Router are explicitly
 * ignored to preserve instant client-side transitions without flashing.
 */
@Injectable({ providedIn: 'root' })
export class CrossAppNavService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  readonly isNavigating = signal<boolean>(false);

  private resetTimeout: ReturnType<typeof setTimeout> | null = null;
  private cleanupListeners: (() => void) | null = null;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const clickHandler = (event: MouseEvent): void => {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) {
          return;
        }

        const target = event.target as HTMLElement | null;
        const anchor = target?.closest('a') as HTMLAnchorElement | null;
        if (!anchor) {
          return;
        }

        // Ignore Angular SPA router links
        if (anchor.hasAttribute('routerlink') || anchor.hasAttribute('ng-reflect-router-link')) {
          return;
        }

        // Ignore target="_blank", downloads, fragment jumps, or non-HTTP protocols
        if (anchor.target === '_blank' || anchor.hasAttribute('download')) {
          return;
        }

        const rawHref = anchor.getAttribute('href') ?? '';
        if (
          !rawHref ||
          rawHref.startsWith('#') ||
          rawHref.startsWith('javascript:') ||
          rawHref.startsWith('mailto:') ||
          rawHref.startsWith('tel:')
        ) {
          return;
        }

        const isExplicitCrossApp = anchor.getAttribute('data-cross-app') === 'true';
        let isCrossDestination = false;

        try {
          const destUrl = new URL(anchor.href, window.location.href);
          if (destUrl.origin !== window.location.origin) {
            isCrossDestination = true;
          }
        } catch {
          // If URL parsing fails, ignore
        }

        if (isExplicitCrossApp || isCrossDestination) {
          this.startNav();
        }
      };

      const resetHandler = (): void => {
        this.stopNav();
      };

      document.addEventListener('click', clickHandler, { capture: true, passive: true });
      window.addEventListener('pageshow', resetHandler);
      window.addEventListener('pagehide', resetHandler);

      this.cleanupListeners = (): void => {
        document.removeEventListener('click', clickHandler, { capture: true });
        window.removeEventListener('pageshow', resetHandler);
        window.removeEventListener('pagehide', resetHandler);
      };
    });

    if (typeof window !== 'undefined') {
      (window as unknown as { __testCrossAppNav?: (durationMs?: number) => void }).__testCrossAppNav = (
        durationMs = 2500,
      ) => {
        this.startNav();
        setTimeout(() => {
          this.stopNav();
        }, durationMs);
      };
    }
  }

  startNav(): void {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
    this.ngZone.run(() => {
      this.isNavigating.set(true);
    });

    // Safety timeout: automatically reset after 10 seconds if navigation was cancelled
    this.resetTimeout = setTimeout(() => {
      this.ngZone.run(() => {
        this.isNavigating.set(false);
      });
      this.resetTimeout = null;
    }, 10000);
  }

  stopNav(): void {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }
    this.ngZone.run(() => {
      this.isNavigating.set(false);
    });
  }

  navigateCrossApp(url: string): void {
    this.startNav();
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = url;
    }
  }

  ngOnDestroy(): void {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }
    if (this.cleanupListeners) {
      this.cleanupListeners();
      this.cleanupListeners = null;
    }
  }
}
