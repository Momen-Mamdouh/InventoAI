import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError, firstValueFrom } from 'rxjs';
import {
  BuilderState,
  DraftApi,
  StoreApi,
  ThemesApi,
  QuestionsApi,
  DraftResponse,
  StoreResponse,
  GetThemesResponse,
  ThemeItem,
  InterviewQuestionConfig,
} from '@invento/site-builder-data-access-builder';

describe('BuilderState', () => {
  let state: BuilderState;
  let draftApiMock: { getDraft: ReturnType<typeof vi.fn> };
  let storeApiMock: { getMyStore: ReturnType<typeof vi.fn> };
  let themesApiMock: { getThemes: ReturnType<typeof vi.fn> };
  let questionsApiMock: { getQuestions: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    draftApiMock = {
      getDraft: vi.fn().mockReturnValue(of(null)),
    };
    storeApiMock = {
      getMyStore: vi.fn().mockReturnValue(of(null)),
    };
    themesApiMock = {
      getThemes: vi.fn().mockReturnValue(of({ themes: [] })),
    };
    questionsApiMock = {
      getQuestions: vi.fn().mockReturnValue(of({ questions: [] })),
    };

    TestBed.configureTestingModule({
      providers: [
        BuilderState,
        { provide: DraftApi, useValue: draftApiMock },
        { provide: StoreApi, useValue: storeApiMock },
        { provide: ThemesApi, useValue: themesApiMock },
        { provide: QuestionsApi, useValue: questionsApiMock },
      ],
    });

    state = TestBed.inject(BuilderState);
  });

  describe('Initial State and Transitions', () => {
    it('has default initial signal values', () => {
      expect(state.isHydrated()).toBe(false);
      expect(state.hasLiveStore()).toBe(false);
      expect(state.isTransitioning()).toBe(false);
      expect(state.transitionLabel()).toBe('Invento AI');
      expect(state.stepEnforcement()).toBeNull();
      expect(state.brainstorm()).toBe('');
      expect(state.hasLogo()).toBe(false);
      expect(state.businessName()).toBe('');
      expect(state.domain()).toBe('');
      expect(state.themes()).toEqual([]);
    });

    it('manages transition lifecycle', () => {
      state.startTransition('Generating Theme');
      expect(state.isTransitioning()).toBe(true);
      expect(state.transitionLabel()).toBe('Generating Theme');

      state.stopTransition();
      expect(state.isTransitioning()).toBe(false);
    });

    it('triggers step enforcement events with timestamp', () => {
      const before = Date.now();
      state.triggerStepEnforcement('validation');
      const event = state.stepEnforcement();
      expect(event).not.toBeNull();
      expect(event?.stepId).toBe('validation');
      expect(event?.timestamp).toBeGreaterThanOrEqual(before);
    });
  });

  describe('Step Completion Computeds', () => {
    it('evaluates brainstorm completion correctly', () => {
      expect(state.hasBrainstormInput()).toBe(false);
      expect(state.isBrainstormComplete()).toBe(false);
      expect(state.isStepComplete('brainstorm')).toBe(false);

      state.brainstorm.set('A modern luxury fashion store for premium apparel and accessories');
      state.hasLogo.set(true);
      expect(state.hasBrainstormInput()).toBe(true);

      state.brainstormAnalyzed.set(true);
      expect(state.isBrainstormComplete()).toBe(true);
      expect(state.isStepComplete('brainstorm')).toBe(true);
    });

    it('evaluates ai-interview completion correctly', () => {
      expect(state.hasAiInterviewAnswers()).toBe(false);
      expect(state.isAiInterviewComplete()).toBe(false);
      expect(state.isStepComplete('ai-interview')).toBe(false);

      const requiredQuestions: InterviewQuestionConfig[] = [
        { id: 'q1', label: 'Required 1', type: 'text', required: true },
        { id: 'q2', label: 'Required 2', type: 'single', required: true, options: ['A', 'B'] },
        { id: 'q3', label: 'Optional', type: 'text', required: false },
      ];
      state.questions.set(requiredQuestions);

      state.aiAnswers.set({ q1: 'Answer 1' });
      expect(state.hasAiInterviewAnswers()).toBe(false);

      state.aiAnswers.set({ q1: 'Answer 1', q2: 0 });
      expect(state.hasAiInterviewAnswers()).toBe(true);

      state.aiInterviewSubmitted.set(true);
      expect(state.isAiInterviewComplete()).toBe(true);
      expect(state.isStepComplete('ai-interview')).toBe(true);
    });

    it('evaluates validation completion correctly', () => {
      expect(state.hasValidationInputs()).toBe(false);
      expect(state.isValidationComplete()).toBe(false);
      expect(state.isStepComplete('validation')).toBe(false);

      state.businessName.set('Acme Store');
      state.businessType.set('Retail');
      state.targetAudience.set('Adults');
      expect(state.hasValidationInputs()).toBe(true);

      state.domainConfirmed.set(true);
      expect(state.isValidationComplete()).toBe(true);
      expect(state.isStepComplete('validation')).toBe(true);
    });

    it('evaluates preview completion correctly', () => {
      expect(state.isPreviewComplete()).toBe(false);
      expect(state.isStepComplete('preview')).toBe(false);

      state.selectedTheme.set('theme-modern-dark');
      expect(state.isPreviewComplete()).toBe(true);
      expect(state.isStepComplete('preview')).toBe(true);
    });
  });

  describe('Change Detection Helpers', () => {
    it('detects brainstorm text and logo changes', () => {
      state.brainstorm.set('Original Concept');
      expect(state.hasBrainstormChanged('Original Concept', false)).toBe(false);
      expect(state.hasBrainstormChanged('Modified Concept', false)).toBe(true);
      expect(state.hasBrainstormChanged('Original Concept', true)).toBe(true);
    });

    it('detects AI answers changes accurately', () => {
      state.aiAnswers.set({ q1: 'Initial', q2: [1, 2] });

      expect(state.haveAiAnswersChanged({ q1: 'Initial', q2: [1, 2] })).toBe(false);
      expect(state.haveAiAnswersChanged({ q1: 'Initial', q2: [2, 1] })).toBe(false);
      expect(state.haveAiAnswersChanged({ q1: 'Initial', q2: [1, 3] })).toBe(true);
      expect(state.haveAiAnswersChanged({ q1: 'Changed', q2: [1, 2] })).toBe(true);
      expect(state.haveAiAnswersChanged({ q1: 'Initial', q2: [1] })).toBe(true);
      expect(state.haveAiAnswersChanged({ q1: 'Initial' })).toBe(true);
      expect(state.haveAiAnswersChanged({ q1: 'Initial', q2: [1, 2], q3: 'Extra' })).toBe(true);
    });
  });

  describe('Backend Hydration and State Restoration', () => {
    it('hydrates from draft response with brainstormed step', async () => {
      const mockDraft: DraftResponse = {
        step: 'brainstormed',
        brainstorm: 'High end streetwear',
        logoUrl: 'https://example.com/logo.png',
        businessName: 'Urban Pulse',
        slug: 'urban-pulse',
        answers: [{ questionId: 'q1', answer: 'Hip hop culture' }],
      };
      draftApiMock.getDraft.mockReturnValue(of(mockDraft));

      const outcome = await firstValueFrom(state.hydrateFromBackend());

      expect(state.isHydrated()).toBe(true);
      expect(state.brainstorm()).toBe('High end streetwear');
      expect(state.logoUrl()).toBe('https://example.com/logo.png');
      expect(state.hasLogo()).toBe(true);
      expect(state.businessName()).toBe('Urban Pulse');
      expect(state.domain()).toBe('urban-pulse');
      expect(state.aiAnswers()).toEqual({ q1: 'Hip hop culture' });
      expect(state.brainstormAnalyzed()).toBe(true);
      expect(state.aiInterviewSubmitted()).toBe(false);
      expect(state.domainConfirmed()).toBe(false);
      expect(outcome.isBrainstormComplete).toBe(true);
    });

    it('hydrates from draft response with answered step', async () => {
      const mockDraft: DraftResponse = {
        step: 'answered',
        brainstorm: 'Electronics store',
        logoUrl: null,
        businessName: 'Gizmo Hub',
        slug: 'gizmo-hub',
        answers: [],
      };
      draftApiMock.getDraft.mockReturnValue(of(mockDraft));

      await firstValueFrom(state.hydrateFromBackend());
      expect(state.brainstormAnalyzed()).toBe(true);
      expect(state.aiInterviewSubmitted()).toBe(true);
      expect(state.domainConfirmed()).toBe(false);
    });

    it('hydrates from draft response with domain_confirmed, themed, or published step', async () => {
      const mockDraft: DraftResponse = {
        step: 'domain_confirmed',
        brainstorm: 'Coffee roasters',
        logoUrl: null,
        businessName: 'Bean Artisan',
        slug: 'bean-artisan',
        answers: [],
      };
      draftApiMock.getDraft.mockReturnValue(of(mockDraft));

      await firstValueFrom(state.hydrateFromBackend());
      expect(state.brainstormAnalyzed()).toBe(true);
      expect(state.aiInterviewSubmitted()).toBe(true);
      expect(state.domainConfirmed()).toBe(true);
    });

    it('hydrates live store properties and themes', async () => {
      const mockStore: StoreResponse = {
        id: 'store-live',
        name: 'Live Brand',
        slug: 'live-brand',
        status: 'live',
        logoUrl: 'https://example.com/store-logo.png',
        description: 'Live Store Description',
        heroHeadline: 'Welcome to Live Brand',
        heroSubtitle: 'Best in class',
      };
      const mockThemeItem: ThemeItem = {
        id: 'theme-1',
        name: 'Aurora',
        description: 'Minimalist clean theme',
        style: 'modern',
        font: 'Inter',
        radius: '0.5rem',
        light: { primary: '#000000' },
        dark: { primary: '#ffffff' },
        isSelected: true,
        css: {
          basePreset: 'neutral',
          name: 'Aurora',
          description: 'Minimalist clean theme',
          rawCss: ':root { --primary: #000; }',
        },
      };
      const mockThemes: GetThemesResponse = {
        themes: [mockThemeItem],
      };
      storeApiMock.getMyStore.mockReturnValue(of(mockStore));
      themesApiMock.getThemes.mockReturnValue(of(mockThemes));

      const outcome = await firstValueFrom(state.hydrateFromBackend());
      expect(state.hasLiveStore()).toBe(true);
      expect(state.businessName()).toBe('Live Brand');
      expect(state.domain()).toBe('live-brand');
      expect(state.logoUrl()).toBe('https://example.com/store-logo.png');
      expect(state.themes().length).toBe(1);
      expect(outcome.hasLiveStore).toBe(true);
      expect(outcome.isThemed).toBe(true);
    });

    it('returns existing outcome immediately if already hydrated', async () => {
      state.isHydrated.set(true);
      state.domainConfirmed.set(true);

      const outcome = await firstValueFrom(state.hydrateFromBackend());
      expect(outcome.isDomainConfirmed).toBe(true);
      expect(draftApiMock.getDraft).not.toHaveBeenCalled();
    });

    it('recovers gracefully if backend calls error during hydration', async () => {
      draftApiMock.getDraft.mockReturnValue(throwError(() => new Error('Network error')));
      storeApiMock.getMyStore.mockReturnValue(throwError(() => new Error('Server error')));
      themesApiMock.getThemes.mockReturnValue(throwError(() => new Error('Timeout')));

      const outcome = await firstValueFrom(state.hydrateFromBackend());
      expect(outcome).toBeDefined();
      expect(state.isHydrated()).toBe(true);
    });

    it('catches and recovers when hydration mapping throws an unexpected error', async () => {
      let callCount = 0;
      vi.spyOn(state, 'getHydrationOutcome').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Corrupted draft payload');
        }
        return {
          hasLiveStore: false,
          isThemed: false,
          isDomainConfirmed: false,
          isAiInterviewComplete: false,
          isBrainstormComplete: false,
        };
      });
      draftApiMock.getDraft.mockReturnValue(of({ step: 'brainstormed' } as DraftResponse));

      const outcome = await firstValueFrom(state.hydrateFromBackend());
      expect(outcome).toBeDefined();
    });
  });

  describe('Reset and Question Loading', () => {
    it('resets all state fields to clean defaults', () => {
      state.brainstorm.set('Some text');
      state.hasLogo.set(true);
      state.businessName.set('Some Name');
      state.isHydrated.set(true);
      state.hasLiveStore.set(true);

      state.reset();

      expect(state.brainstorm()).toBe('');
      expect(state.hasLogo()).toBe(false);
      expect(state.businessName()).toBe('');
      expect(state.isHydrated()).toBe(false);
      expect(state.hasLiveStore()).toBe(false);
    });

    it('loads questionnaire from backend when questions are returned', () => {
      const serverQuestions: InterviewQuestionConfig[] = [
        { id: 'custom-1', label: 'Target Market', type: 'text', required: true },
      ];
      questionsApiMock.getQuestions.mockReturnValue(of({ questions: serverQuestions }));

      state.loadQuestions();
      expect(state.questions()).toEqual(serverQuestions);
    });

    it('retains bundled questions if backend returns empty list', () => {
      const initialQuestions = state.questions();
      questionsApiMock.getQuestions.mockReturnValue(of({ questions: [] }));

      state.loadQuestions();
      expect(state.questions()).toEqual(initialQuestions);
    });
  });
});
