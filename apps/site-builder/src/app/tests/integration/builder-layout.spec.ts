import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { toast } from '@spartan/helm/sonner';
import { BuilderLayout } from '@invento/site-builder-feature-shell';
import { BuilderState, BUILDER_STEPS } from '@invento/site-builder-data-access-builder';
import { LocaleService } from '@invento/shared-util-i18n';
import { SITE_BUILDER_ENVIRONMENT } from '@invento/site-builder-data-access-preview';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('BuilderLayout Component Integration', () => {
  let fixture: ComponentFixture<BuilderLayout>;
  let component: BuilderLayout;
  let builderState: BuilderState;
  let router: Router;
  let warningSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    sessionStorage.clear();

    const mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => `translated_${k}`),
    };

    warningSpy = vi.spyOn(toast, 'warning').mockImplementation(() => '');

    await TestBed.configureTestingModule({
      imports: [BuilderLayout, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        BuilderState,
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

    fixture = TestBed.createComponent(BuilderLayout);
    component = fixture.componentInstance;
    builderState = TestBed.inject(BuilderState);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    warningSpy.mockRestore();
    TestBed.resetTestingModule();
  });

  it('creates the builder layout', () => {
    expect(component).toBeTruthy();
  });

  it('renders steps bar and loader outlets', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-steps-bar')).toBeTruthy();
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  describe('Step click navigation & enforcement', () => {
    it('allows moving backwards or to current step without blocking', () => {
      vi.spyOn(router, 'url', 'get').mockReturnValue('/build/ai-interview');

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent;

      const layoutRef = component as unknown as {
        onStepClick: (args: { step: (typeof BUILDER_STEPS)[0]; event: MouseEvent }) => void;
      };

      // Clicking brainstorm (earlier step)
      layoutRef.onStepClick({ step: BUILDER_STEPS[0], event: mockEvent });
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(warningSpy).not.toHaveBeenCalled();
    });

    it('blocks jumping to ai-interview when brainstorm has no logo', () => {
      vi.spyOn(router, 'url', 'get').mockReturnValue('/build/brainstorm');
      builderState.hasLogo.set(false);

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent;

      const triggerSpy = vi.spyOn(builderState, 'triggerStepEnforcement');

      const layoutRef = component as unknown as {
        onStepClick: (args: { step: (typeof BUILDER_STEPS)[0]; event: MouseEvent }) => void;
      };

      layoutRef.onStepClick({ step: BUILDER_STEPS[1], event: mockEvent });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(warningSpy).toHaveBeenCalledWith('translated_toast_step_brainstorm_missing_logo');
      expect(triggerSpy).toHaveBeenCalledWith('brainstorm');
    });

    it('blocks jumping ahead when brainstorm is missing description', () => {
      vi.spyOn(router, 'url', 'get').mockReturnValue('/build/brainstorm');
      builderState.hasLogo.set(true);
      builderState.brainstorm.set('');

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent;

      const layoutRef = component as unknown as {
        onStepClick: (args: { step: (typeof BUILDER_STEPS)[0]; event: MouseEvent }) => void;
      };

      layoutRef.onStepClick({ step: BUILDER_STEPS[2], event: mockEvent });

      expect(warningSpy).toHaveBeenCalledWith('translated_toast_step_brainstorm_missing_desc');
    });

    it('blocks jumping ahead when brainstorm has input but is not analyzed', () => {
      vi.spyOn(router, 'url', 'get').mockReturnValue('/build/brainstorm');
      builderState.hasLogo.set(true);
      builderState.brainstorm.set('A valid brand description for my custom shop');
      builderState.brainstormAnalyzed.set(false);

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent;

      const layoutRef = component as unknown as {
        onStepClick: (args: { step: (typeof BUILDER_STEPS)[0]; event: MouseEvent }) => void;
      };

      layoutRef.onStepClick({ step: BUILDER_STEPS[2], event: mockEvent });

      expect(warningSpy).toHaveBeenCalledWith('translated_toast_step_brainstorm_not_analyzed');
    });

    it('blocks jumping to validation when interview is incomplete', () => {
      vi.spyOn(router, 'url', 'get').mockReturnValue('/build/ai-interview');
      builderState.hasLogo.set(true);
      builderState.brainstorm.set('A valid brand description for my custom shop');
      builderState.brainstormAnalyzed.set(true);
      builderState.aiAnswers.set({});

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent;

      const layoutRef = component as unknown as {
        onStepClick: (args: { step: (typeof BUILDER_STEPS)[0]; event: MouseEvent }) => void;
      };

      layoutRef.onStepClick({ step: BUILDER_STEPS[2], event: mockEvent });

      expect(warningSpy).toHaveBeenCalledWith('translated_toast_step_interview_incomplete');
    });

    it('blocks jumping to validation when interview answers exist but not submitted', () => {
      vi.spyOn(router, 'url', 'get').mockReturnValue('/build/ai-interview');
      builderState.hasLogo.set(true);
      builderState.brainstorm.set('A valid brand description for my custom shop');
      builderState.brainstormAnalyzed.set(true);

      const allAnswers: Record<string, string> = {};
      builderState.questions().forEach((q) => {
        allAnswers[q.id] = 'Valid Answer';
      });
      builderState.aiAnswers.set(allAnswers);
      builderState.aiInterviewSubmitted.set(false);

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent;

      const layoutRef = component as unknown as {
        onStepClick: (args: { step: (typeof BUILDER_STEPS)[0]; event: MouseEvent }) => void;
      };

      layoutRef.onStepClick({ step: BUILDER_STEPS[2], event: mockEvent });

      expect(warningSpy).toHaveBeenCalledWith('translated_toast_step_interview_submit_required');
    });

    it('blocks jumping to preview when validation inputs are missing', () => {
      vi.spyOn(router, 'url', 'get').mockReturnValue('/build/validation');
      builderState.hasLogo.set(true);
      builderState.brainstorm.set('A valid brand description');
      builderState.brainstormAnalyzed.set(true);
      builderState.aiAnswers.set({ q1: 'Brand' });
      builderState.aiInterviewSubmitted.set(true);
      builderState.businessName.set('');

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent;

      const layoutRef = component as unknown as {
        onStepClick: (args: { step: (typeof BUILDER_STEPS)[0]; event: MouseEvent }) => void;
      };

      layoutRef.onStepClick({ step: BUILDER_STEPS[3], event: mockEvent });

      expect(warningSpy).toHaveBeenCalledWith('translated_toast_step_validation_incomplete');
    });

    it('blocks jumping to preview when domain is unconfirmed', () => {
      vi.spyOn(router, 'url', 'get').mockReturnValue('/build/validation');
      builderState.hasLogo.set(true);
      builderState.brainstorm.set('A valid brand description');
      builderState.brainstormAnalyzed.set(true);
      builderState.aiAnswers.set({ q1: 'Brand' });
      builderState.aiInterviewSubmitted.set(true);
      builderState.businessName.set('Valid Brand');
      builderState.businessType.set('Retail');
      builderState.targetAudience.set('General');
      builderState.domain.set('valid-brand');
      builderState.domainConfirmed.set(false);

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent;

      const layoutRef = component as unknown as {
        onStepClick: (args: { step: (typeof BUILDER_STEPS)[0]; event: MouseEvent }) => void;
      };

      layoutRef.onStepClick({ step: BUILDER_STEPS[3], event: mockEvent });

      expect(warningSpy).toHaveBeenCalledWith('translated_toast_step_validation_check_domain');
    });
  });
});
