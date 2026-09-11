import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { toast } from '@spartan/helm/sonner';
import { Validation } from '@invento/site-builder-feature-builder';
import {
  BuilderState,
  DomainApi,
  ThemesApi,
  ThemeItem,
} from '@invento/site-builder-data-access-builder';
import { LocaleService } from '@invento/shared-util-i18n';
import { SITE_BUILDER_ENVIRONMENT, ApiConfig } from '@invento/site-builder-data-access-preview';
import { HttpClientTestingModule } from '@angular/common/http/testing';

class MockObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: MockObserver,
  configurable: true,
});
Object.defineProperty(globalThis, 'ResizeObserver', { value: MockObserver, configurable: true });

describe('Validation Component Integration', () => {
  let fixture: ComponentFixture<Validation>;
  let component: Validation;
  let builderState: BuilderState;
  let domainApiMock: { confirmDomain: ReturnType<typeof vi.fn> };
  let themesApiMock: {
    generateThemes: ReturnType<typeof vi.fn>;
    getThemes: ReturnType<typeof vi.fn>;
  };
  let router: Router;
  let toastErrorSpy: ReturnType<typeof vi.spyOn>;
  let toastInfoSpy: ReturnType<typeof vi.spyOn>;
  let toastSuccessSpy: ReturnType<typeof vi.spyOn>;
  let toastWarningSpy: ReturnType<typeof vi.spyOn>;

  const mockTheme: ThemeItem = {
    id: 'th-1',
    name: 'Minimal',
    description: 'Minimal theme',
    style: 'default',
    font: 'inter',
    radius: '0.5rem',
    light: { background: '#fff', primary: '#000' },
    dark: {},
    isSelected: false,
    css: { basePreset: 'default', name: 'Minimal', description: '', rawCss: '' },
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    sessionStorage.clear();

    domainApiMock = {
      confirmDomain: vi.fn().mockReturnValue(of({ success: true, hint: 'Great brand!' })),
    };

    themesApiMock = {
      generateThemes: vi.fn().mockReturnValue(of({ themes: [mockTheme] })),
      getThemes: vi.fn().mockReturnValue(of({ themes: [mockTheme] })),
    };

    const mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => `translated_${k}`),
    };

    toastErrorSpy = vi.spyOn(toast, 'error').mockImplementation(() => '');
    toastInfoSpy = vi.spyOn(toast, 'info').mockImplementation(() => '');
    toastSuccessSpy = vi.spyOn(toast, 'success').mockImplementation(() => '');
    toastWarningSpy = vi.spyOn(toast, 'warning').mockImplementation(() => '');

    await TestBed.configureTestingModule({
      imports: [Validation, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        BuilderState,
        ApiConfig,
        { provide: DomainApi, useValue: domainApiMock },
        { provide: ThemesApi, useValue: themesApiMock },
        {
          provide: SITE_BUILDER_ENVIRONMENT,
          useValue: {
            production: false,
            apiUrl: 'http://localhost:3000',
            dashboardUrl: 'http://localhost:4200',
          },
        },
        { provide: LocaleService, useValue: mockLocaleService },
      ],
    }).compileComponents();

    builderState = TestBed.inject(BuilderState);
    builderState.businessName.set('');
    builderState.domain.set('');

    fixture = TestBed.createComponent(Validation);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    toastErrorSpy.mockRestore();
    toastInfoSpy.mockRestore();
    toastSuccessSpy.mockRestore();
    toastWarningSpy.mockRestore();
    TestBed.resetTestingModule();
  });

  it('creates the validation component', () => {
    expect(component).toBeTruthy();
  });

  describe('Seeding and Input Synchronization', () => {
    it('seeds business inputs from aiAnswers if empty', () => {
      builderState.aiAnswers.set({
        q1: 'Solaris Apparel',
        q2: 'Fashion',
        q3: 'Young adults',
      });

      (component as unknown as { seedFromInterview: () => void }).seedFromInterview();

      expect(builderState.businessName()).toBe('Solaris Apparel');
      expect(builderState.businessType()).toBe('Fashion');
      expect(builderState.targetAudience()).toBe('Young adults');
      expect(builderState.domain()).toBe('solaris-apparel');
    });

    it('derives domain slug automatically on business name change when domain is untouched', () => {
      component.onBusinessNameChange('Velvet Moon');
      expect(builderState.businessName()).toBe('Velvet Moon');
      expect(builderState.domain()).toBe('velvet-moon');
    });

    it('stops deriving domain slug once domain has been touched manually', () => {
      component.onDomainChange('custom-slug');
      expect(component.domainTouched()).toBe(true);

      component.onBusinessNameChange('Updated Brand Name');
      expect(builderState.businessName()).toBe('Updated Brand Name');
      expect(builderState.domain()).toBe('custom-slug');
    });

    it('resets domain to match name when syncDomainWithName is called', () => {
      builderState.businessName.set('Velvet Moon');
      component.onDomainChange('custom-slug');
      expect(component.domainTouched()).toBe(true);

      component.syncDomainWithName();
      expect(component.domainTouched()).toBe(false);
      expect(builderState.domain()).toBe('velvet-moon');
    });

    it('applies suggestions and marks domain as touched and available', () => {
      component.applySuggestion('brand-shop');
      expect(builderState.domain()).toBe('brand-shop');
      expect(component.selectedSuggestion()).toBe('brand-shop');
      expect(component.domainAvailability()).toBe('available');
    });

    it('generates proactive suggestions on exploreSuggestions', () => {
      builderState.businessName.set('Zenith');
      component.exploreSuggestions();
      expect(component.proactiveSuggestions().length).toBeGreaterThan(0);
      expect(component.proactiveSuggestions()[0]).toBe('zenith-shop');
    });
  });

  describe('Brand Metrics & Real-time Rule Checks', () => {
    it('computes brand metrics dynamically based on business name', () => {
      builderState.businessName.set('Solara');
      const metrics = component.brandMetrics();
      expect(metrics.memorability).toBeGreaterThan(80);
      expect(metrics.pronunciationGrade).toBe('Fluent');
    });

    it('validates nameChecks and domainChecks', () => {
      builderState.businessName.set('Clean Store');
      builderState.domain.set('clean-store');

      expect(component.allNameChecksPassed()).toBe(true);
      expect(component.allDomainChecksPassed()).toBe(true);
      expect(component.allChecksPassed()).toBe(true);

      builderState.domain.set('invalid--slug');
      expect(component.allDomainChecksPassed()).toBe(false);
      expect(component.allChecksPassed()).toBe(false);
    });

    it('computes fullStoreUrl correctly', () => {
      builderState.domain.set('my-store');
      expect(component.fullStoreUrl()).toContain('/my-store');
    });
  });

  describe('Clipboard Copy', () => {
    it('copies store url to clipboard and toggles urlCopied signal', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
      });

      builderState.domain.set('my-store');
      component.copyStoreUrl();

      expect(writeTextMock).toHaveBeenCalledWith(component.fullStoreUrl());
      await new Promise((r) => setTimeout(r, 20));
      expect(component.urlCopied()).toBe(true);
    });
  });

  describe('Finish & Submission Pipeline', () => {
    beforeEach(() => {
      builderState.businessName.set('Aurora Boutique');
      builderState.businessType.set('Fashion');
      builderState.targetAudience.set('Women');
      builderState.domain.set('aurora-boutique');
      component.domainAvailability.set('available');
    });

    it('fast-paths to /build/preview if domain is confirmed and themes already exist', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      builderState.domainConfirmed.set(true);
      builderState.themes.set([mockTheme]);

      component.finish();

      expect(toastInfoSpy).toHaveBeenCalledWith('translated_validation_resumed_notice');
      expect(navigateSpy).toHaveBeenCalledWith(['/build/preview']);
      expect(domainApiMock.confirmDomain).not.toHaveBeenCalled();
    });

    it('executes full pipeline: confirmDomain -> generateThemes -> Preview', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      builderState.domainConfirmed.set(false);
      builderState.themes.set([]);

      component.finish();

      expect(builderState.isNavigating()).toBe(true);
      expect(component.currentStep()).toBe('AI_ANALYSIS');

      await new Promise((r) => setTimeout(r, 950));

      expect(domainApiMock.confirmDomain).toHaveBeenCalledWith({
        businessName: 'Aurora Boutique',
        domain: 'aurora-boutique',
      });
      expect(themesApiMock.generateThemes).toHaveBeenCalled();
      expect(builderState.themes()).toEqual([mockTheme]);
      expect(builderState.domainConfirmed()).toBe(true);
      expect(component.isSubmitting()).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/build/preview']);
      expect(toastSuccessSpy).toHaveBeenCalledWith('translated_validation_domain_confirmed');
    });

    it('falls back to getThemes when generateThemes returns empty', async () => {
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      themesApiMock.generateThemes.mockReturnValue(of({ themes: [] }));
      themesApiMock.getThemes.mockReturnValue(of({ themes: [mockTheme] }));
      builderState.domainConfirmed.set(false);
      builderState.themes.set([]);

      component.finish();
      await new Promise((r) => setTimeout(r, 950));

      expect(themesApiMock.getThemes).toHaveBeenCalled();
      expect(builderState.themes()).toEqual([mockTheme]);
    });

    it('handles domain confirmation failure with suggestions', async () => {
      domainApiMock.confirmDomain.mockReturnValue(
        throwError(() => ({
          error: {
            message: 'Domain already taken',
            suggestions: ['aurora-boutique-shop', 'aurora-boutique-store'],
          },
        })),
      );
      builderState.domainConfirmed.set(false);

      component.finish();
      await new Promise((r) => setTimeout(r, 950));

      expect(component.isSubmitting()).toBe(false);
      expect(component.currentStep()).toBe('INPUT');
      expect(component.domainAvailability()).toBe('unavailable');
      expect(component.domainSuggestions()).toEqual([
        'aurora-boutique-shop',
        'aurora-boutique-store',
      ]);
      expect(toastErrorSpy).toHaveBeenCalledWith('Domain already taken', undefined);
    });

    it('falls back to algorithmic suggestions when error has no suggestions array', async () => {
      domainApiMock.confirmDomain.mockReturnValue(
        throwError(() => ({
          error: {
            message: 'Server error',
          },
        })),
      );
      builderState.domainConfirmed.set(false);

      component.finish();
      await new Promise((r) => setTimeout(r, 950));

      expect(component.domainAvailability()).toBe('unavailable');
      expect(component.domainSuggestions().length).toBeGreaterThan(0);
    });

    it('sets domain availability to invalid when slug length is less than 3', () => {
      component.onDomainChange('ab');
      expect(component.domainAvailability()).toBe('invalid');

      component.onDomainChange('');
      expect(component.domainAvailability()).toBe('invalid');
    });

    it('applies a domain suggestion and triggers check', () => {
      component.applySuggestion('suggested-brand');
      expect(builderState.domain()).toBe('suggested-brand');
      expect(component.selectedSuggestion()).toBe('suggested-brand');
      expect(component.domainAvailability()).toBe('available');
    });

    it('updates target audience in builderState on change', () => {
      component.onTargetAudienceChange('Outdoor Enthusiasts');
      expect(builderState.targetAudience()).toBe('Outdoor Enthusiasts');
    });
  });
});
