import { inject, Injectable, NgZone, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toast } from '@spartan-ng/brain/sonner';

/**
 * Cross-app network connectivity tracking service.
 *
 * Monitors `window.online` and `window.offline` events and triggers non-intrusive
 * status toasts via HlmToaster when the device loses or restores network connection.
 */
@Injectable({ providedIn: 'root' })
export class NetworkService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private cleanupListeners: (() => void) | null = null;

  readonly isOnline = signal<boolean>(true);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isOnline.set(navigator.onLine ?? true);

    this.ngZone.runOutsideAngular(() => {
      const onOnline = (): void => {
        this.ngZone.run(() => {
          this.isOnline.set(true);
          toast.success('Connection restored. Back online.', {
            id: 'network-status',
            duration: 3500,
          });
        });
      };

      const onOffline = (): void => {
        this.ngZone.run(() => {
          this.isOnline.set(false);
          toast.warning('Connection lost. You are currently offline.', {
            id: 'network-status',
            duration: Infinity,
          });
        });
      };

      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);

      this.cleanupListeners = (): void => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      };
    });

    if (typeof window !== 'undefined') {
      (window as unknown as { __toggleNetworkStatus?: (online?: boolean) => void }).__toggleNetworkStatus = (
        online?: boolean,
      ) => {
        const next = typeof online === 'boolean' ? online : !this.isOnline();
        if (next) {
          window.dispatchEvent(new Event('online'));
        } else {
          window.dispatchEvent(new Event('offline'));
        }
      };
    }
  }

  ngOnDestroy(): void {
    if (this.cleanupListeners) {
      this.cleanupListeners();
    }
  }
}
