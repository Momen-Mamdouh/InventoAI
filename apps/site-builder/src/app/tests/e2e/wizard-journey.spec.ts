import { TestBed } from '@angular/core/testing';
import { signal, PLATFORM_ID } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import {
  Brainstorm,
  AiInterview,
  Validation,
  Preview,
} from '@invento/site-builder-feature-builder';
import {
  BuilderState,
  BrainstormApi,
  AiInterviewApi,
  DomainApi,
  ThemesApi,
  PublishApi,
  PreviewDataClient,
} from '@invento/site-builder-data-access-builder';
import { ThemeSuggestion } from '@invento/shared-util-preview-types';
import { AuthService } from '@invento/shared-data-access-auth';
import { ApiConfig, SITE_BUILDER_ENVIRONMENT } from '@invento/site-builder-data-access-preview';
import { LocaleService } from '@invento/shared-util-i18n';
import { toast } from '@spartan/helm/sonner';
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
Element.prototype.scrollIntoView = vi.fn();

const MOCK_THEME: ThemeSuggestion = {
  id: 'theme-nordic',
  name: 'Nordic Clean',
  description: 'Clean Scandinavian aesthetic',
  colors: {
    background: '#ffffff',
    foreground: '#09090b',
    primary: '#2563eb',
    primaryForeground: '#ffffff',
    secondary: '#f4f4f5',
    secondaryForeground: '#18181b',
    accent: '#3b82f6',
    border: '#e4e4e7',
    ring: '#2563eb',
    destructive: '#ef4444',
  },
  radius: '0.5rem',
};

describe('E2E Journey: Complete Site Builder Wizard', () => {
  let builderState: BuilderState;
  let router: Router;
  let brainstormApiMock: { analyzePrompt: ReturnType<typeof vi.fn> };
  let aiInterviewApiMock: { submitAnswers: ReturnType<typeof vi.fn> };
  let domainApiMock: { confirmDomain: ReturnType<typeof vi.fn> };
  let themesApiMock: {
    generateThemes: ReturnType<typeof vi.fn>;
    getThemes: ReturnType<typeof vi.fn>;
  };
  let publishApiMock: { publishSite: ReturnType<typeof vi.fn> };
  let authServiceMock: {
    currentUser: ReturnType<typeof signal<{ id: string; storeSlug?: string } | null>>;
    getSsoUrl: ReturnType<typeof vi.fn>;
  };
  let previewDataClientMock: {
    themeSuggestions: ReturnType<typeof signal<ThemeSuggestion[]>>;
    products: ReturnType<
      typeof signal<{ id: string; name: string; price: number; image: string }[]>
    >;
    navTabs: ReturnType<typeof signal<{ id: string; label: string }[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    loaded: ReturnType<typeof signal<boolean>>;
    themeError: ReturnType<typeof signal<string | null>>;
    themesUnavailable: ReturnType<typeof signal<boolean>>;
    loadThemes: ReturnType<typeof vi.fn>;
    reload: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    sessionStorage.clear();

    vi.spyOn(toast, 'error').mockImplementation(() => '');
    vi.spyOn(toast, 'info').mockImplementation(() => '');
    vi.spyOn(toast, 'success').mockImplementation(() => '');
    vi.spyOn(toast, 'warning').mockImplementation(() => '');

    brainstormApiMock = {
      analyzePrompt: vi.fn().mockReturnValue(
        of({
          questions: [
            { questionId: 'q1', answer: 'Nordic Craft Co' },
            { questionId: 'q2', answer: 'Minimalist leather goods' },
          ],
        }),
      ),
    };

    aiInterviewApiMock = {
      submitAnswers: vi.fn().mockReturnValue(
        of({
          success: true,
          businessName: 'Nordic Craft Co',
          domain: 'nordic-craft',
        }),
      ),
    };

    domainApiMock = {
      confirmDomain: vi.fn().mockReturnValue(of({ success: true, hint: 'Available brand name' })),
    };

    themesApiMock = {
      generateThemes: vi.fn().mockReturnValue(
        of({
          themes: [
            {
              id: 'theme-nordic',
              name: 'Nordic Clean',
              description: 'Minimalist aesthetic',
              style: 'clean',
              font: 'inter',
              radius: '0.5rem',
              light: { background: '#ffffff', primary: '#2563eb' },
              dark: {},
              isSelected: true,
              css: { basePreset: 'clean', name: 'Nordic Clean', description: '', rawCss: '' },
            },
          ],
        }),
      ),
      getThemes: vi.fn().mockReturnValue(of({ themes: [] })),
    };

    publishApiMock = {
      publishSite: vi.fn().mockReturnValue(of({ success: true, slug: 'nordic-craft' })),
    };

    authServiceMock = {
      currentUser: signal<{ id: string; storeSlug?: string } | null>({ id: 'owner-42' }),
      getSsoUrl: vi.fn().mockReturnValue('http://localhost:4200/sso-redirect'),
    };

    previewDataClientMock = {
      themeSuggestions: signal<ThemeSuggestion[]>([MOCK_THEME]),
      products: signal([
        { id: 'item-1', name: 'Artisan Wallet', price: 65, image: 'https://img.com/wallet.png' },
      ]),
      navTabs: signal([
        { id: 'tab-1', label: 'Home' },
        { id: 'tab-2', label: 'Shop' },
      ]),
      isLoading: signal(false),
      loaded: signal(true),
      themeError: signal<string | null>(null),
      themesUnavailable: signal(false),
      loadThemes: vi.fn(),
      reload: vi.fn(),
    };

    const mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => `trans_${k}`),
    };

    await TestBed.configureTestingModule({
      imports: [Brainstorm, AiInterview, Validation, Preview, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        BuilderState,
        ApiConfig,
        { provide: BrainstormApi, useValue: brainstormApiMock },
        { provide: AiInterviewApi, useValue: aiInterviewApiMock },
        { provide: DomainApi, useValue: domainApiMock },
        { provide: ThemesApi, useValue: themesApiMock },
        { provide: PublishApi, useValue: publishApiMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: PreviewDataClient, useValue: previewDataClientMock },
        {
          provide: SITE_BUILDER_ENVIRONMENT,
          useValue: {
            production: false,
            apiUrl: 'http://localhost:3000',
            dashboardUrl: 'http://localhost:4200',
          },
        },
        { provide: LocaleService, useValue: mockLocaleService },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    builderState = TestBed.inject(BuilderState);
    router = TestBed.inject(Router);
  });

  it('runs complete multi-step wizard lifecycle from brainstorm to live publication', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // ==========================================
    // STAGE 1: Brainstorm
    // ==========================================
    const brainstormFixture = TestBed.createComponent(Brainstorm);
    const brainstormComp = brainstormFixture.componentInstance;
    brainstormFixture.detectChanges();

    builderState.hasLogo.set(true);
    builderState.logoUrl.set('data:image/png;base64,sample');

    brainstormComp.descriptionControl.setValue(
      'An artisan leather handbag store designed for young professionals seeking timeless accessories.',
    );
    expect(brainstormComp.isValidConcept()).toBe(true);

    brainstormComp.onNext();
    await new Promise((r) => setTimeout(r, 950));

    expect(brainstormApiMock.analyzePrompt).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/build/ai-interview']);
    expect(builderState.isBrainstormComplete()).toBe(true);
    expect(builderState.aiAnswers()['q1']).toBe('Nordic Craft Co');

    // ==========================================
    // STAGE 2: AI Interview
    // ==========================================
    const interviewFixture = TestBed.createComponent(AiInterview);
    const interviewComp = interviewFixture.componentInstance;
    interviewComp.ngOnInit();
    interviewFixture.detectChanges();

    interviewComp.visibleQuestions().forEach((q) => {
      const control = interviewComp.form.get(q.id);
      if (control) {
        if (q.type === 'multi') {
          control.setValue(['Online Store']);
        } else {
          control.setValue(q.id === 'q1' ? 'Nordic Craft Co' : 'Fashion and Accessories');
        }
      }
    });
    builderState.aiInterviewSubmitted.set(false);

    interviewComp.onNext();
    await new Promise((r) => setTimeout(r, 950));

    expect(aiInterviewApiMock.submitAnswers).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/build/validation']);
    expect(builderState.isAiInterviewComplete()).toBe(true);

    // ==========================================
    // STAGE 3: Domain & Identity Validation
    // ==========================================
    const validationFixture = TestBed.createComponent(Validation);
    const validationComp = validationFixture.componentInstance;
    validationFixture.detectChanges();

    expect(builderState.businessName()).toBe('Nordic Craft Co');
    expect(validationComp.allChecksPassed()).toBe(true);

    validationComp.finish();
    await new Promise((r) => setTimeout(r, 950));

    expect(domainApiMock.confirmDomain).toHaveBeenCalled();
    expect(themesApiMock.generateThemes).toHaveBeenCalled();
    expect(builderState.domainConfirmed()).toBe(true);
    expect(builderState.themes().length).toBe(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/build/preview']);
    expect(builderState.isValidationComplete()).toBe(true);

    // ==========================================
    // STAGE 4: Theme Preview & Publish
    // ==========================================
    const previewFixture = TestBed.createComponent(Preview);
    const previewComp = previewFixture.componentInstance;
    previewFixture.detectChanges();

    expect(previewComp.activeTheme().id).toBe('theme-nordic');
    expect(previewComp.brandName()).toBe('Nordic Craft Co');

    previewComp.confirmDeployment();
    await new Promise((r) => setTimeout(r, 950));

    expect(publishApiMock.publishSite).toHaveBeenCalledWith({ themeId: 'theme-nordic' });
    expect(builderState.hasLiveStore()).toBe(true);
    expect(builderState.domain()).toBe('nordic-craft');
    expect(authServiceMock.currentUser()?.storeSlug).toBe('nordic-craft');
  }, 15000);
});
