import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, firstValueFrom, Observable } from 'rxjs';
import { hasNoStoreGuard } from './has-no-store.guard';
import { StoreApi, StoreResponse } from '@invento/site-builder-data-access-builder';
import { LocaleService } from '@invento/shared-util-i18n';
import { toast } from 'ngx-sonner';

describe('hasNoStoreGuard', () => {
  let storeApiMock: { getMyStore: ReturnType<typeof vi.fn> };
  let routerMock: { createUrlTree: ReturnType<typeof vi.fn> };
  let localeServiceMock: { translate: ReturnType<typeof vi.fn> };
  let toastInfoSpy: ReturnType<typeof vi.spyOn>;
  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    toastInfoSpy = vi.spyOn(toast, 'info').mockImplementation(() => '');
    storeApiMock = {
      getMyStore: vi.fn(),
    };
    routerMock = {
      createUrlTree: vi.fn(
        (commands: string[]) => ({ toString: () => commands.join('/') }) as unknown as UrlTree,
      ),
    };
    localeServiceMock = {
      translate: vi.fn((key: string) => key),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: StoreApi, useValue: storeApiMock },
        { provide: Router, useValue: routerMock },
        { provide: LocaleService, useValue: localeServiceMock },
      ],
    });
  });

  afterEach(() => {
    toastInfoSpy.mockRestore();
  });

  it('allows access when owner has no store (null response)', async () => {
    storeApiMock.getMyStore.mockReturnValue(of(null));

    const result$ = TestBed.runInInjectionContext(() =>
      hasNoStoreGuard(dummyRoute, dummyState),
    ) as Observable<boolean | UrlTree>;

    const result = await firstValueFrom(result$);
    expect(result).toBe(true);
    expect(toastInfoSpy).not.toHaveBeenCalled();
  });

  it('allows access when store status is still draft', async () => {
    const draftStore: StoreResponse = {
      id: 'store-1',
      name: 'Draft Store',
      status: 'draft',
      slug: 'draft-store',
      logoUrl: null,
      description: null,
      heroHeadline: null,
      heroSubtitle: null,
    };
    storeApiMock.getMyStore.mockReturnValue(of(draftStore));

    const result$ = TestBed.runInInjectionContext(() =>
      hasNoStoreGuard(dummyRoute, dummyState),
    ) as Observable<boolean | UrlTree>;

    const result = await firstValueFrom(result$);
    expect(result).toBe(true);
    expect(toastInfoSpy).not.toHaveBeenCalled();
  });

  it('redirects to /home and displays toast when store status is live', async () => {
    const liveStore: StoreResponse = {
      id: 'store-2',
      name: 'Live Store',
      status: 'live',
      slug: 'live-store',
      logoUrl: 'https://example.com/logo.png',
      description: 'Live Store Description',
      heroHeadline: 'Welcome',
      heroSubtitle: 'To our store',
    };
    storeApiMock.getMyStore.mockReturnValue(of(liveStore));

    const result$ = TestBed.runInInjectionContext(() =>
      hasNoStoreGuard(dummyRoute, dummyState),
    ) as Observable<boolean | UrlTree>;

    const result = await firstValueFrom(result$);
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/home']);
    expect(localeServiceMock.translate).toHaveBeenCalledWith('toast_has_existing_store');
    expect(toastInfoSpy).toHaveBeenCalledWith('toast_has_existing_store', {
      id: 'existing-store-guard-toast',
    });
    expect(result).toBeDefined();
  });
});
