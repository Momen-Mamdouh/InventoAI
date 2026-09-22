import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { signal } from '@angular/core';
import { storeGuard } from '../../guards/store.guard';
import { noStoreGuard } from '../../guards/no-store.guard';
import { NoStore } from '../../pages/no-store/no-store';
import { Sidebar } from '@invento/owner-dashboard-feature-shell';
import { AuthService, User } from '@invento/shared-data-access-auth';
import { LocaleService } from '@invento/shared-util-i18n';
import { ThemeService } from '@invento/shared-util-theme';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: '<div id="home-dashboard">Welcome to Store Dashboard</div>',
})
class MockHomeDashboard {}

describe('E2E Journey: Store Onboarding and Access Control', () => {
  let router: Router;
  let storeSlugSignal: ReturnType<typeof signal<string | null>>;
  let currentUserSignal: ReturnType<typeof signal<User | null>>;
  let authServiceMock: {
    currentUser: ReturnType<typeof signal<User | null>>;
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    getStoreSlug: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof signal<boolean>>;
  };
  let themeServiceMock: {
    isDark: ReturnType<typeof signal<boolean>>;
    toggleTheme: ReturnType<typeof vi.fn>;
  };

  const mockUser: User = {
    id: 'usr-1',
    email: 'merchant@invento.ai',
    firstName: 'Kareem',
    lastName: 'Merchant',
    image: 'https://example.com/avatar.jpg',
    role: 'owner',
    storeSlug: null,
    isEmailVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const routes: Routes = [
    {
      path: '',
      canActivate: [storeGuard],
      component: MockHomeDashboard,
    },
    {
      path: 'home',
      component: MockHomeDashboard,
    },
    {
      path: 'no-store',
      canActivate: [noStoreGuard],
      component: NoStore,
    },
  ];

  beforeEach(async () => {
    storeSlugSignal = signal<string | null>(null);
    currentUserSignal = signal<User | null>(mockUser);

    authServiceMock = {
      currentUser: currentUserSignal,
      isAuthenticated: signal(true),
      getStoreSlug: vi.fn(() => storeSlugSignal()),
      logout: vi.fn(),
    };

    localeServiceMock = {
      translate: vi.fn((k: string) => k),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: signal(false),
    };

    themeServiceMock = {
      isDark: signal(false),
      toggleTheme: vi.fn(),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [MockHomeDashboard, NoStore, Sidebar],
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: authServiceMock },
        { provide: LocaleService, useValue: localeServiceMock },
        { provide: ThemeService, useValue: themeServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('Step 1: blocks store-less merchant from accessing dashboard and redirects to /no-store', async () => {
    storeSlugSignal.set(null);

    const canAccessHome = await router.navigateByUrl('/');
    expect(canAccessHome).toBe(true);
    expect(router.url).toBe('/no-store');
  });

  it('Step 2: renders no-store guidance page with CTA pointing to Site Builder', () => {
    const fixture = TestBed.createComponent(NoStore);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('home.no_store_title');
    expect(compiled.textContent).toContain('home.build_store_cta');

    const button = compiled.querySelector('button');
    expect(button).not.toBeNull();
  });

  it('Step 3: after creating store in site builder, storeGuard grants access to dashboard', async () => {
    storeSlugSignal.set('cairo-prime');

    const canAccessHome = await router.navigateByUrl('/');
    expect(canAccessHome).toBe(true);
    expect(router.url).toBe('/');
  });

  it('Step 4: authenticated merchant with active store sees shell sidebar with owner identity', () => {
    storeSlugSignal.set('cairo-prime');

    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('hlm-sidebar')).not.toBeNull();
    expect(fixture.componentInstance['user']()?.name).toBe('Kareem Merchant');
  });
});
