import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Sidebar } from '@invento/owner-dashboard-feature-shell';
import { NoStore } from '../../pages/no-store/no-store';
import { NotFound } from '../../pages/not-found/not-found';
import { AuthService, User } from '@invento/shared-data-access-auth';
import { LocaleService } from '@invento/shared-util-i18n';
import { ThemeService } from '@invento/shared-util-theme';

describe('Shell Chrome and Layout Integration Tests', () => {
  let authServiceMock: {
    currentUser: ReturnType<typeof signal<User | null>>;
    getStoreSlug: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof vi.fn>;
    setLocale: ReturnType<typeof vi.fn>;
  };
  let themeServiceMock: {
    isDark: ReturnType<typeof signal<boolean>>;
    toggleTheme: ReturnType<typeof vi.fn>;
  };

  const mockUser: User = {
    id: 'usr-1',
    firstName: 'Tariq',
    lastName: 'Mansoor',
    email: 'tariq@example.com',
    role: 'owner',
    image: 'https://example.com/avatar.jpg',
    storeSlug: 'voltix',
    isEmailVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    authServiceMock = {
      currentUser: signal<User | null>(mockUser),
      getStoreSlug: vi.fn().mockReturnValue('voltix'),
      logout: vi.fn(),
    };

    localeServiceMock = {
      translate: vi.fn((k: string) => k),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: vi.fn().mockReturnValue(false),
      setLocale: vi.fn(),
    };

    themeServiceMock = {
      isDark: signal(false),
      toggleTheme: vi.fn(),
    };
  });

  describe('Sidebar Component', () => {
    let fixture: ComponentFixture<Sidebar>;
    let component: Sidebar;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [Sidebar],
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: authServiceMock },
          { provide: LocaleService, useValue: localeServiceMock },
          { provide: ThemeService, useValue: themeServiceMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(Sidebar);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates Sidebar component and resolves user profile', () => {
      expect(component).toBeDefined();
      expect(component['user']()?.name).toContain('Tariq');
      expect(component['user']()?.image).toBe('https://example.com/avatar.jpg');
    });

    it('contains navigation links for all owner dashboard modules', () => {
      const items = component['navItems'];
      const routes = items.map((i) => i.route);

      expect(routes).toContain('/home');
      expect(routes).toContain('/catalog-ai');
      expect(routes).toContain('/products');
      expect(routes).toContain('/attributes');
      expect(routes).toContain('/categories');
      expect(routes).toContain('/orders');
      expect(routes).toContain('/faq');
      expect(routes).toContain('/suppliers');
      expect(routes).toContain('/purchase-requests');
      expect(routes).toContain('/chatbot');
    });
  });

  describe('NoStore Component', () => {
    let fixture: ComponentFixture<NoStore>;
    let component: NoStore;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [NoStore],
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: authServiceMock },
          { provide: LocaleService, useValue: localeServiceMock },
          { provide: ThemeService, useValue: themeServiceMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(NoStore);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates NoStore component and sets siteBuilderUrl', () => {
      expect(component).toBeDefined();
      expect(component.siteBuilderUrl()).toBeDefined();
      expect(typeof component.siteBuilderUrl()).toBe('string');
    });
  });

  describe('NotFound Component', () => {
    let fixture: ComponentFixture<NotFound>;
    let component: NotFound;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [NotFound],
        providers: [provideRouter([])],
      }).compileComponents();

      fixture = TestBed.createComponent(NotFound);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates NotFound component cleanly', () => {
      expect(component).toBeDefined();
    });
  });
});
