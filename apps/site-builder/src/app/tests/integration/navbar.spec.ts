import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Navbar } from '@invento/site-builder-feature-shell';
import { AuthService, User } from '@invento/shared-data-access-auth';
import { ApiConfig, SITE_BUILDER_ENVIRONMENT } from '@invento/site-builder-data-access-preview';
import { LocaleService } from '@invento/shared-util-i18n';
import { ThemeService } from '@invento/shared-util-theme';

describe('Navbar Component Integration', () => {
  let fixture: ComponentFixture<Navbar>;
  let component: Navbar;
  let currentUserSignal: ReturnType<typeof signal<User | null>>;
  let isAuthenticatedMock: ReturnType<typeof vi.fn>;
  let isRtlSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    currentUserSignal = signal<User | null>(null);
    isAuthenticatedMock = vi.fn().mockReturnValue(false);
    isRtlSignal = signal(false);

    const mockAuthService = {
      currentUser: currentUserSignal,
      isAuthenticated: isAuthenticatedMock,
      getSsoUrl: vi.fn(
        (baseUrl: string, targetPath: string) => `${baseUrl}/sso?returnUrl=${targetPath}`,
      ),
      logout: vi.fn(),
    };

    const mockLocaleService = {
      isRtl: isRtlSignal,
      locale: signal('en'),
      translate: vi.fn((k: string) => k),
    };

    const mockThemeService = {
      isDark: signal(false),
      theme: signal('light'),
      setTheme: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        ApiConfig,
        {
          provide: SITE_BUILDER_ENVIRONMENT,
          useValue: {
            production: false,
            apiUrl: 'http://localhost:3000',
            dashboardUrl: 'http://localhost:4200',
          },
        },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LocaleService, useValue: mockLocaleService },
        { provide: ThemeService, useValue: mockThemeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates the navbar component', () => {
    expect(component).toBeTruthy();
  });

  describe('Guest State (Unauthenticated)', () => {
    it('computes isAuthenticated as false and ownerName as empty', () => {
      fixture.detectChanges();
      expect(component.isAuthenticated()).toBe(false);
      expect(component.ownerName()).toBe('');
    });

    it('renders Sign In button linking to /auth/login', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const signInLink = compiled.querySelector('a[href="/auth/login"]');
      expect(signInLink).toBeTruthy();
      expect(compiled.querySelector('[data-testid="owner-pill"]')).toBeNull();
    });
  });

  describe('Authenticated State', () => {
    beforeEach(() => {
      currentUserSignal.set({
        id: 'usr-1',
        email: 'owner@example.com',
        firstName: 'Sarah',
        lastName: 'Connor',
        role: 'owner',
      } as unknown as User);
      isAuthenticatedMock.mockReturnValue(true);
    });

    it('computes isAuthenticated as true and ownerName as firstName', () => {
      fixture.detectChanges();
      expect(component.isAuthenticated()).toBe(true);
      expect(component.ownerName()).toBe('Sarah');
    });

    it('computes valid SSO dashboard url', () => {
      fixture.detectChanges();
      expect(component.dashboardUrl()).toContain('/sso?returnUrl=/home');
    });

    it('renders dashboard button, owner name, and sign out button', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Sarah');
      const dashboardLink = compiled.querySelector('a[href*="/sso?returnUrl=/home"]');
      expect(dashboardLink).toBeTruthy();
      expect(compiled.querySelector('app-sign-out-button')).toBeTruthy();
    });
  });

  describe('RTL & Layout Adaptations', () => {
    it('reflects localeService.isRtl state', () => {
      expect(component.isRtl()).toBe(false);
      isRtlSignal.set(true);
      expect(component.isRtl()).toBe(true);
    });
  });
});
