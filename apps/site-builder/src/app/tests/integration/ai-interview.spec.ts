import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { toast } from '@spartan/helm/sonner';
import { AiInterview } from '@invento/site-builder-feature-builder';
import {
  BuilderState,
  AiInterviewApi,
  InterviewQuestionConfig,
} from '@invento/site-builder-data-access-builder';
import { LocaleService } from '@invento/shared-util-i18n';
import { SITE_BUILDER_ENVIRONMENT } from '@invento/site-builder-data-access-preview';
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

describe('AiInterview Component Integration', () => {
  let fixture: ComponentFixture<AiInterview>;
  let component: AiInterview;
  let builderState: BuilderState;
  let aiInterviewApiMock: { submitAnswers: ReturnType<typeof vi.fn> };
  let router: Router;
  let toastErrorSpy: ReturnType<typeof vi.spyOn>;
  let toastInfoSpy: ReturnType<typeof vi.spyOn>;
  let toastSuccessSpy: ReturnType<typeof vi.spyOn>;

  const mockQuestions: InterviewQuestionConfig[] = [
    {
      id: 'q1',
      label: 'Store Name',
      type: 'text',
      required: true,
    },
    {
      id: 'q2',
      label: 'Primary Category',
      type: 'single',
      required: true,
      options: ['Apparel', 'Tech', 'Home & Living'],
    },
    {
      id: 'q3',
      label: 'Sales Channels',
      type: 'multi',
      required: true,
      options: ['Online', 'Instagram', 'Pop-up'],
    },
    {
      id: 'q4',
      label: 'Logo Vibe',
      type: 'single',
      required: false,
      showWhen: 'logoUploaded',
      options: ['Modern', 'Vintage'],
    },
  ];

  beforeEach(async () => {
    TestBed.resetTestingModule();
    sessionStorage.clear();

    aiInterviewApiMock = {
      submitAnswers: vi.fn().mockReturnValue(of({ success: true })),
    };

    const mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => `translated_${k}`),
    };

    toastErrorSpy = vi.spyOn(toast, 'error').mockImplementation(() => '');
    toastInfoSpy = vi.spyOn(toast, 'info').mockImplementation(() => '');
    toastSuccessSpy = vi.spyOn(toast, 'success').mockImplementation(() => '');

    await TestBed.configureTestingModule({
      imports: [AiInterview, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        BuilderState,
        { provide: AiInterviewApi, useValue: aiInterviewApiMock },
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
    builderState.questions.set(mockQuestions);
    builderState.hasLogo.set(false);

    fixture = TestBed.createComponent(AiInterview);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    toastErrorSpy.mockRestore();
    toastInfoSpy.mockRestore();
    toastSuccessSpy.mockRestore();
    TestBed.resetTestingModule();
  });

  it('creates the ai interview component', () => {
    expect(component).toBeTruthy();
  });

  describe('Questions Filtering & Visibility', () => {
    it('filters out questions requiring logo when no logo was uploaded', () => {
      builderState.hasLogo.set(false);
      expect(component.visibleQuestions().length).toBe(3);
      expect(component.visibleQuestions().some((q) => q.id === 'q4')).toBe(false);
    });

    it('includes logo-dependent questions when logo is uploaded', () => {
      builderState.hasLogo.set(true);
      expect(component.visibleQuestions().length).toBe(4);
      expect(component.visibleQuestions().some((q) => q.id === 'q4')).toBe(true);
    });
  });

  describe('Form Initialization & Selection helpers', () => {
    beforeEach(() => {
      builderState.aiAnswers.set({
        q1: 'Initial Store',
        q2: 'Tech',
        q3: ['Online', 'Instagram'],
      });
      component.ngOnInit();
    });

    it('initializes form controls with decoded prefill answers', () => {
      expect(component.form.get('q1')?.value).toBe('Initial Store');
      expect(component.form.get('q2')?.value).toBe('Tech');
      expect(component.form.get('q3')?.value).toEqual(['Online', 'Instagram']);
    });

    it('detects AI suggested options accurately', () => {
      expect(component.isAiSuggested('q2', 'Tech')).toBe(true);
      expect(component.isAiSuggested('q2', 'Apparel')).toBe(false);
      expect(component.isAiSuggested('q3', 'Online')).toBe(true);
    });

    it('handles onSingleSelect updates', () => {
      component.onSingleSelect('q2', 'Apparel');
      expect(component.form.get('q2')?.value).toBe('Apparel');
      expect(component.isQuestionAnswered('q2')).toBe(true);
    });

    it('handles toggleMultiSelect adding and removing options', () => {
      // Current is ['Online', 'Instagram']. Add 'Pop-up'
      component.toggleMultiSelect('q3', 'Pop-up');
      expect(component.form.get('q3')?.value).toEqual(['Online', 'Instagram', 'Pop-up']);
      expect(component.isChannelSelected('q3', 'Pop-up')).toBe(true);

      // Toggle 'Pop-up' again to remove it
      component.toggleMultiSelect('q3', 'Pop-up');
      expect(component.form.get('q3')?.value).toEqual(['Online', 'Instagram']);
      expect(component.isChannelSelected('q3', 'Pop-up')).toBe(false);
    });

    it('verifies isQuestionCompleted and isQuestionAnswered', () => {
      expect(component.isQuestionCompleted('q1')).toBe(true);
      expect(component.isQuestionAnswered('q1')).toBe(true);

      (component.form.controls as Record<string, FormControl>)['q1']?.setValue('');
      expect(component.isQuestionCompleted('q1')).toBe(false);
      expect(component.isQuestionAnswered('q1')).toBe(false);
    });
  });

  describe('Step navigation and submission flow', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('navigates back to /build/brainstorm when prev is called at first question', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component.onPrevStep();
      expect(navigateSpy).toHaveBeenCalledWith(['/build/brainstorm']);
    });

    it('blocks submission and surfaces error toast if required questions are incomplete', () => {
      const controls = component.form.controls as Record<string, FormControl>;
      controls['q1']?.setValue('');
      controls['q2']?.setValue('');
      controls['q3']?.setValue([]);

      component.onNext();

      expect(toastErrorSpy).toHaveBeenCalledWith('translated_toast_required_questions');
      expect(component.invalidQuestionIds().length).toBeGreaterThan(0);
      expect(aiInterviewApiMock.submitAnswers).not.toHaveBeenCalled();
    });

    it('fast-paths to /build/validation if already submitted and answers have not changed', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const answers = {
        q1: 'Echo Store',
        q2: 'Apparel',
        q3: ['Online'],
      };
      component.form.setValue(answers);
      builderState.aiAnswers.set(answers);
      builderState.aiInterviewSubmitted.set(true);

      component.onNext();

      expect(toastInfoSpy).toHaveBeenCalledWith('translated_interview_resumed_notice');
      expect(navigateSpy).toHaveBeenCalledWith(['/build/validation']);
      expect(aiInterviewApiMock.submitAnswers).not.toHaveBeenCalled();
    });

    it('submits answers to aiInterviewApi on valid completion', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const answers = {
        q1: 'New Brand Name',
        q2: 'Tech',
        q3: ['Online'],
      };
      component.form.setValue(answers);
      builderState.aiInterviewSubmitted.set(false);

      component.onNext();
      expect(component.isSubmitting()).toBe(true);

      await new Promise((r) => setTimeout(r, 950));

      expect(aiInterviewApiMock.submitAnswers).toHaveBeenCalled();
      expect(builderState.aiInterviewSubmitted()).toBe(true);
      expect(builderState.businessName()).toBe('New Brand Name');
      expect(component.isSubmitting()).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/build/validation']);
      expect(toastSuccessSpy).toHaveBeenCalledWith('translated_toast_answers_success');
    });

    it('handles submission error gracefully', async () => {
      aiInterviewApiMock.submitAnswers.mockReturnValue(
        throwError(() => new Error('Server failure')),
      );
      const answers = {
        q1: 'Brand Name',
        q2: 'Tech',
        q3: ['Online'],
      };
      component.form.setValue(answers);

      component.onNext();
      await new Promise((r) => setTimeout(r, 950));

      expect(component.isSubmitting()).toBe(false);
      expect(toastErrorSpy).toHaveBeenCalled();
    });

    it('handles onInputEnter to advance step on enter key without shift', () => {
      const nextStepSpy = vi.spyOn(component, 'onNextStep');
      const preventDefaultMock = vi.fn();
      const keyboardEvent = {
        shiftKey: false,
        preventDefault: preventDefaultMock,
      } as unknown as KeyboardEvent;

      component.onInputEnter(keyboardEvent);
      expect(preventDefaultMock).toHaveBeenCalled();
      expect(nextStepSpy).toHaveBeenCalled();
    });

    it('does not advance on onInputEnter when shift key is pressed', () => {
      const nextStepSpy = vi.spyOn(component, 'onNextStep');
      const preventDefaultMock = vi.fn();
      const keyboardEvent = {
        shiftKey: true,
        preventDefault: preventDefaultMock,
      } as unknown as KeyboardEvent;

      component.onInputEnter(keyboardEvent);
      expect(preventDefaultMock).not.toHaveBeenCalled();
      expect(nextStepSpy).not.toHaveBeenCalled();
    });

    it('returns early from onNext if already submitting', () => {
      component.isSubmitting.set(true);
      component.onNext();

      expect(toastErrorSpy).toHaveBeenCalledWith('translated_toast_required_questions');
      expect(aiInterviewApiMock.submitAnswers).not.toHaveBeenCalled();
    });
  });
});
