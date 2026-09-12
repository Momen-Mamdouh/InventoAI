import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
} from '@angular/router';
import { Subscription } from 'rxjs';

/**
 * Coordinates customized storefront loading states across router transitions,
 * initial store redirects, and asynchronous feature actions.
 */
@Injectable({ providedIn: 'root' })
export class StoreLoaderService implements OnDestroy {
  private readonly router = inject(Router);

  private readonly _isLoading = signal<boolean>(false);
  private readonly _isInitialSplash = signal<boolean>(true);
  private readonly _progress = signal<number>(0);
  private readonly _statusKey = signal<string>('store_loader.loading');

  /** Whether the store loader overlay or top bar should be visible */
  readonly isLoading = this._isLoading.asReadonly();
  /** Whether the full-screen branded splash is active (initial visit / redirect) */
  readonly isInitialSplash = this._isInitialSplash.asReadonly();
  /** Progress percentage (0 - 100) for smooth visual feedback */
  readonly progress = this._progress.asReadonly();
  /** Optional status key for contextual loading message */
  readonly statusKey = this._statusKey.asReadonly();

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private exitTimer: ReturnType<typeof setTimeout> | null = null;
  private hasCompletedInitialLoad = false;
  private readonly routerSub: Subscription;

  constructor() {
    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.handleNavigationStart();
      } else if (event instanceof RouteConfigLoadStart) {
        this.startImmediateLoading();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError ||
        event instanceof RouteConfigLoadEnd
      ) {
        if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
          this.handleNavigationComplete();
        }
      }
    });

    // In case the initial page was already resolved before this service was constructed
    if (this.router.navigated && !this.hasCompletedInitialLoad) {
      this.hasCompletedInitialLoad = true;
      this._isInitialSplash.set(false);
      this._isLoading.set(false);
    }
  }

  private handleNavigationStart(): void {
    this.clearTimers();

    const isFirstVisit = !this.hasCompletedInitialLoad;
    if (isFirstVisit) {
      this._isInitialSplash.set(true);
      this._statusKey.set('store_loader.preparing');
      this.activateLoading();
    } else {
      // For page-to-page navigation, debounce 75ms to eliminate flicker on instant renders
      this.debounceTimer = setTimeout(() => {
        this._isInitialSplash.set(false);
        this._statusKey.set('store_loader.navigating');
        this.activateLoading();
      }, 75);
    }
  }

  private startImmediateLoading(): void {
    this.clearTimers();
    this.activateLoading();
  }

  private activateLoading(): void {
    this._isLoading.set(true);
    this._progress.set(15);

    // Simulate steady progress while waiting for chunk/route to settle
    this.progressInterval = setInterval(() => {
      this._progress.update((curr) => {
        if (curr >= 90) {
          return curr;
        }
        const increment = Math.max(2, Math.floor((90 - curr) * 0.15));
        return curr + increment;
      });
    }, 120);
  }

  private handleNavigationComplete(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (!this._isLoading()) {
      this.hasCompletedInitialLoad = true;
      this._isInitialSplash.set(false);
      return;
    }

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    // Snap to 100%
    this._progress.set(100);

    // Allow CSS transition to finish before dropping the element
    const exitDuration = this._isInitialSplash() ? 400 : 250;
    this.exitTimer = setTimeout(() => {
      this._isLoading.set(false);
      this._progress.set(0);
      this.hasCompletedInitialLoad = true;
      this._isInitialSplash.set(false);
      this.exitTimer = null;
    }, exitDuration);
  }

  /**
   * Programmatic manual trigger to display the loader during heavy operations.
   */
  show(initialSplash = false, statusKey = 'store_loader.loading'): void {
    this.clearTimers();
    this._isInitialSplash.set(initialSplash);
    this._statusKey.set(statusKey);
    this.activateLoading();
  }

  /**
   * Programmatic manual trigger to hide the loader.
   */
  hide(): void {
    this.handleNavigationComplete();
  }

  private clearTimers(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    if (this.exitTimer) {
      clearTimeout(this.exitTimer);
      this.exitTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.routerSub.unsubscribe();
  }
}
