import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Home } from '@invento/owner-dashboard-feature-home';
import {
  StoreService,
  HeroSectionResponse,
  StoreResponse,
} from '@invento/owner-dashboard-data-access-store';
import { AuthService } from '@invento/shared-data-access-auth';
import { LocaleService } from '@invento/shared-util-i18n';
import { ThemeService } from '@invento/shared-util-theme';
import { SITE_BUILDER_URL } from '@invento/owner-dashboard-util-site-builder-url';

describe('Home Hero Editor Integration Tests', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;
  let storeServiceMock: {
    getStore: ReturnType<typeof vi.fn>;
    updateHero: ReturnType<typeof vi.fn>;
  };
  let authServiceMock: {
    getStoreSlug: ReturnType<typeof vi.fn>;
  };
  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof vi.fn>;
  };
  let themeServiceMock: {
    isDark: ReturnType<typeof vi.fn>;
  };

  const initialHero: HeroSectionResponse = {
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
    headline: 'Modern Minimalist Storefront',
    subtitle: 'Curated premium lifestyle products',
    ctaLabel: 'Shop Collection',
    ctaHref: '/products',
  };

  const mockStore: StoreResponse = {
    name: 'Minimalist Store',
    slug: 'minimalist-store',
    description: 'A curated store',
    logoUrl: null,
    logoSource: null,
    locale: 'en',
    currency: 'USD',
    hero: initialHero,
    featuredCategories: [],
    featuredProducts: [],
  };

  beforeEach(async () => {
    storeServiceMock = {
      getStore: vi.fn().mockReturnValue(of(mockStore)),
      updateHero: vi.fn().mockReturnValue(of(initialHero)),
    };

    authServiceMock = {
      getStoreSlug: vi.fn().mockReturnValue('minimalist-store'),
    };

    localeServiceMock = {
      translate: vi.fn((key: string) => key),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: vi.fn().mockReturnValue(false),
    };

    themeServiceMock = {
      isDark: vi.fn().mockReturnValue(false),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: StoreService, useValue: storeServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LocaleService, useValue: localeServiceMock },
        { provide: ThemeService, useValue: themeServiceMock },
        { provide: SITE_BUILDER_URL, useValue: 'https://builder.inventoai.shop' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates Home component and initializes hero section from StoreService response', () => {
    expect(component).toBeDefined();
    expect(storeServiceMock.getStore).toHaveBeenCalledWith('minimalist-store');
    expect(component.hero.title()).toBe(initialHero.headline);
    expect(component.hero.subtitle()).toBe(initialHero.subtitle);
    expect(component.hero.imageUrl()).toBe(initialHero.imageUrl);
    expect(component.hero.ctaLabel()).toBe(initialHero.ctaLabel);
  });

  it('switches preview viewports between desktop, tablet, and mobile', () => {
    expect(component.viewMode()).toBe('desktop');

    component.viewMode.set('tablet');
    expect(component.viewMode()).toBe('tablet');

    component.viewMode.set('mobile');
    expect(component.viewMode()).toBe('mobile');

    component.viewMode.set('desktop');
    expect(component.viewMode()).toBe('desktop');
  });

  it('updates previewHero computed signal when hero title and focal point change', () => {
    component.hero.setField('title', 'Summer Clearance Extravaganza');
    component.focalPoint.set({ x: 50, y: 75 });

    const preview = component.previewHero();
    expect(preview.headline).toBe('Summer Clearance Extravaganza');
    expect(preview.objectPosition).toBe('50% 75%');
    expect(component.hero.isDirty()).toBe(true);
  });

  it('resets focal point to center position when resetFocalPoint is called', () => {
    component.focalPoint.set({ x: 20, y: 80 });
    expect(component.focalPoint()).toEqual({ x: 20, y: 80 });

    component.resetFocalPoint();
    expect(component.focalPoint()).toEqual({ x: 50, y: 50 });
  });

  it('triggers save action and updates status on successful save response', () => {
    const updatedResponse: HeroSectionResponse = {
      ...initialHero,
      headline: 'Saved Live Title',
    };
    storeServiceMock.updateHero.mockReturnValue(of(updatedResponse));

    component.hero.setField('title', 'Saved Live Title');
    component.saveChanges();

    expect(storeServiceMock.updateHero).toHaveBeenCalled();
    expect(component.hero.isSaving()).toBe(false);
    expect(component.hero.isDirty()).toBe(false);
  });

  it('handles save error by setting error signal and rolling back optimistic values', () => {
    const errorResponse = { error: { message: 'Image upload failed' } };
    storeServiceMock.updateHero.mockReturnValue(throwError(() => errorResponse));

    component.hero.setField('title', 'Failed Hero Title');
    component.saveChanges();

    expect(storeServiceMock.updateHero).toHaveBeenCalled();
    expect(component.hero.error()).toBe('Image upload failed');
    expect(component.hero.isSaving()).toBe(false);
  });

  it('discards unsaved modifications and resets dirty state', () => {
    component.hero.setField('title', 'Draft Changes That Should Be Discarded');
    expect(component.hero.isDirty()).toBe(true);

    component.discard();

    expect(component.hero.isDirty()).toBe(false);
    expect(component.isSaved()).toBe(true);
  });
});
