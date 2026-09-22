import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '@invento/shared-data-access-auth';
import { noStoreGuard } from '../../guards/no-store.guard';

describe('noStoreGuard Unit Tests', () => {
  let routerMock: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };
  let authServiceMock: {
    getStoreSlug: ReturnType<typeof vi.fn>;
  };

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = { url: '/no-store' } as RouterStateSnapshot;

  beforeEach(() => {
    routerMock = {
      createUrlTree: vi.fn(
        (commands: string[]) =>
          ({
            toString: () => commands.join('/'),
          }) as unknown as UrlTree,
      ),
    };

    authServiceMock = {
      getStoreSlug: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    });
  });

  it('allows access to /no-store when store slug is null', () => {
    authServiceMock.getStoreSlug.mockReturnValue(null);

    const result = TestBed.runInInjectionContext(() => noStoreGuard(dummyRoute, dummyState));

    expect(result).toBe(true);
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('allows access to /no-store when store slug is an empty string', () => {
    authServiceMock.getStoreSlug.mockReturnValue('');

    const result = TestBed.runInInjectionContext(() => noStoreGuard(dummyRoute, dummyState));

    expect(result).toBe(true);
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('allows access to /no-store when store slug is undefined', () => {
    authServiceMock.getStoreSlug.mockReturnValue(undefined);

    const result = TestBed.runInInjectionContext(() => noStoreGuard(dummyRoute, dummyState));

    expect(result).toBe(true);
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects to /home when user already has an active store slug', () => {
    authServiceMock.getStoreSlug.mockReturnValue('invento-electronics');

    const result = TestBed.runInInjectionContext(() => noStoreGuard(dummyRoute, dummyState));

    expect(result).toBeDefined();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/home']);
    expect(result?.toString()).toBe('/home');
  });
});
