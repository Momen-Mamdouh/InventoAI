import { TestBed } from '@angular/core/testing';
import { signal, PLATFORM_ID } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { Validation } from '@invento/site-builder-feature-builder';
import {
  BuilderState,
  builderResumeGuard,
  stepGuard,
  DomainApi,
  ThemesApi,
  DraftApi,
} from '@invento/site-builder-data-access-builder';
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

describe('E2E Journey: Resumption and Step Protection', () => {
  let builderState: BuilderState;
  let router: Router;
  let toastInfoSpy: ReturnType<typeof vi.spyOn>;
  let toastWarningSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    sessionStorage.clear();

    toastInfoSpy = vi.spyOn(toast, 'info').mockImplementation(() => '');
    toastWarningSpy = vi.spyOn(toast, 'warning').mockImplementation(() => '');

    const mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => `trans_${k}`),
    };

    const domainApiMock = {
      confirmDomain: vi.fn().mockReturnValue(of({ success: true })),
    };

    const themesApiMock = {
      generateThemes: vi.fn().mockReturnValue(of({ themes: [] })),
      getThemes: vi.fn().mockReturnValue(of({ themes: [] })),
    };

    const draftApiMock = {
      getDraft: vi.fn().mockReturnValue(
        of({
          brainstorm: 'Artisan shoes',
          answers: { q1: 'Cobbler Studio', q2: 'Footwear' },
          domain: 'cobbler-studio',
          domainConfirmed: true,
          themeId: 'theme-classic',
        }),
      ),
      saveDraft: vi.fn().mockReturnValue(of({ success: true })),
    };

    await TestBed.configureTestingModule({
      imports: [Validation, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        BuilderState,
        ApiConfig,
        { provide: DomainApi, useValue: domainApiMock },
        { provide: ThemesApi, useValue: themesApiMock },
        { provide: DraftApi, useValue: draftApiMock },
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

  afterEach(() => {
    toastInfoSpy.mockRestore();
    toastWarningSpy.mockRestore();
  });

  it('resumes user to highest completed step when visiting /build', () => {
    // User had completed brainstorm and interview in a previous session
    builderState.brainstorm.set('Artisan shoes and handcrafted accessories');
    builderState.hasLogo.set(true);
    builderState.brainstormAnalyzed.set(true);
    builderState.aiInterviewSubmitted.set(true);
    builderState.aiAnswers.set({ q1: 'Cobbler Studio', q2: 'Footwear' });

    expect(builderState.isBrainstormComplete()).toBe(true);
    expect(builderState.isAiInterviewComplete()).toBe(true);

    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = { url: '/build' } as RouterStateSnapshot;

    const result$ = TestBed.runInInjectionContext(() => builderResumeGuard(dummyRoute, dummyState));
    (result$ as Observable<UrlTree>).subscribe((urlTree: UrlTree) => {
      expect(urlTree.toString()).toContain('/build/validation');
    });
  });

  it('prevents skipping ahead to preview before validation is completed', () => {
    // Only brainstorm is completed
    builderState.brainstorm.set('Artisan shoes and handcrafted accessories');
    builderState.hasLogo.set(true);
    builderState.brainstormAnalyzed.set(true);
    builderState.aiAnswers.set({});
    builderState.isHydrated.set(true);

    const dummyRoute = {} as ActivatedRouteSnapshot;
    const dummyState = { url: '/build/preview' } as RouterStateSnapshot;

    const guardFn = stepGuard('preview');
    const result$ = TestBed.runInInjectionContext(() => guardFn(dummyRoute, dummyState));

    (result$ as Observable<boolean | UrlTree>).subscribe((val: boolean | UrlTree) => {
      expect(val.toString()).toContain('/build/ai-interview');
    });
    expect(builderState.stepEnforcement()?.stepId).toBe('ai-interview');
  });

  it('fast-paths through validation when domain is already confirmed and themes exist', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    builderState.businessName.set('Cobbler Studio');
    builderState.domain.set('cobbler-studio');
    builderState.domainConfirmed.set(true);
    builderState.themes.set([
      {
        id: 'theme-1',
        name: 'Classic',
        description: '',
        style: '',
        font: '',
        radius: '',
        light: { background: '#fff', primary: '#000' },
        dark: {},
        isSelected: false,
        css: { basePreset: '', name: '', description: '', rawCss: '' },
      },
    ]);

    const fixture = TestBed.createComponent(Validation);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    comp.finish();

    expect(toastInfoSpy).toHaveBeenCalledWith('trans_validation_resumed_notice');
    expect(navigateSpy).toHaveBeenCalledWith(['/build/preview']);
  });
});
