import { Injectable, computed, inject, signal } from '@angular/core';
import { ThemeItem, ThemesApi } from './themes-api';
import { StoreApi } from './store-api';
import { DraftApi } from './draft-api';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import {
  BuilderStepId,
  MIN_BRAINSTORM_LENGTH,
} from './builder-steps';
import {
  INTERVIEW_QUESTIONS,
  InterviewQuestionConfig,
} from './interview-questions';
import { QuestionsApi } from './questions-api';

export type AnswerValue = string | number | string[] | number[];

export interface HydrationOutcome {
  readonly hasLiveStore: boolean;
  readonly isThemed: boolean;
  readonly isDomainConfirmed: boolean;
  readonly isAiInterviewComplete: boolean;
  readonly isBrainstormComplete: boolean;
}

export interface StepEnforcementEvent {
  readonly stepId: BuilderStepId;
  readonly timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class BuilderState {
  private readonly questionsApi = inject(QuestionsApi);
  private readonly storeApi = inject(StoreApi);
  private readonly themesApi = inject(ThemesApi);
  private readonly draftApi = inject(DraftApi);

  readonly isHydrated = signal(false);
  readonly hasLiveStore = signal(false);
  readonly isNavigating = signal(false);
  readonly isTransitioning = signal(false);
  readonly transitionLabel = signal('Invento AI');
  readonly stepEnforcement = signal<StepEnforcementEvent | null>(null);

  startTransition(label = 'Invento AI'): void {
    this.transitionLabel.set(label);
    this.isTransitioning.set(true);
  }

  stopTransition(): void {
    this.isTransitioning.set(false);
  }

  triggerStepEnforcement(stepId: BuilderStepId): void {
    this.stepEnforcement.set({ stepId, timestamp: Date.now() });
  }

  /**
   * Each step is finished only when its own submit button has successfully
   * round-tripped to the backend — never merely because its fields hold
   * values. Answers are pre-filled and restored from sessionStorage, so the
   * field contents cannot tell us whether the call ever happened, and
   * without these flags the wizard could be walked end to end without
   * talking to the backend once.
   *
   * These gate *leaving* a step. They must never gate the submit button
   * itself, or the step would deadlock: use the has*Inputs computeds for
   * that.
   */
  readonly brainstormAnalyzed = signal(false);
  readonly aiInterviewSubmitted = signal(false);
  readonly domainConfirmed = signal(false);
  readonly aiInterviewStepIndex = signal<number>(0);
  readonly brainstorm = signal<string>('');
  readonly hasLogo = signal<boolean>(false);
  readonly logoUrl = signal<string | null>(null);
  readonly aiAnswers = signal<Record<string, AnswerValue>>({});
  readonly selectedTheme = signal<string>('');
  readonly businessName = signal<string>('');
  readonly businessType = signal<string>('');
  readonly targetAudience = signal<string>('');
  readonly domain = signal<string>('');
  readonly themes = signal<ThemeItem[]>([]);

  /**
   * The questionnaire the backend serves. Seeded with the bundled catalog so
   * nothing ever renders empty, then replaced by GET /site-builder/questions —
   * the backend validates answers against its own list, so that list has to
   * win over anything compiled into the bundle.
   */
  readonly questions = signal<InterviewQuestionConfig[]>(INTERVIEW_QUESTIONS);

  readonly hasBrainstormInput = computed(
    () => this.brainstorm().trim().length >= MIN_BRAINSTORM_LENGTH && this.hasLogo(),
  );

  readonly isBrainstormComplete = computed(
    () => this.brainstormAnalyzed() || (this.hasBrainstormInput() && this.brainstormAnalyzed()),
  );

  /**
   * Only *required* questions gate progress. Checking every recorded answer
   * would block users who leave the optional colour question (q7) blank, since
   * the brainstorm step pre-fills a key for it either way.
   */
  readonly hasAiInterviewAnswers = computed(() => {
    const answers = this.aiAnswers();
    if (Object.keys(answers).length === 0) return false;

    return this.questions()
      .filter((q) => q.required)
      .every((q) => {
        const value = answers[q.id];
        if (value === undefined || value === null) return false;
        return Array.isArray(value) ? value.length > 0 : String(value).trim() !== '';
      });
  });

  readonly isAiInterviewComplete = computed(
    () => this.aiInterviewSubmitted() || (this.hasAiInterviewAnswers() && this.aiInterviewSubmitted()),
  );

  readonly hasValidationInputs = computed(
    () =>
      this.businessName().trim() !== '' &&
      this.businessType().trim() !== '' &&
      this.targetAudience().trim() !== '',
  );

  readonly isValidationComplete = computed(
    () => this.domainConfirmed() || (this.hasValidationInputs() && this.domainConfirmed()),
  );

  readonly isPreviewComplete = computed(() => this.selectedTheme() !== '');

  private readonly completionByStep: Record<BuilderStepId, () => boolean> = {
    brainstorm: this.isBrainstormComplete,
    'ai-interview': this.isAiInterviewComplete,
    validation: this.isValidationComplete,
    preview: this.isPreviewComplete,
  };

  isStepComplete(step: BuilderStepId): boolean {
    return this.completionByStep[step]();
  }

  hydrateFromBackend(): Observable<HydrationOutcome> {
    if (this.isHydrated()) {
      return of(this.getHydrationOutcome());
    }

    return forkJoin({
      draft: this.draftApi.getDraft().pipe(catchError(() => of(null))),
      store: this.storeApi.getMyStore().pipe(catchError(() => of(null))),
      themesRes: this.themesApi.getThemes().pipe(catchError(() => of({ themes: [] }))),
    }).pipe(
      map(({ draft, store, themesRes }) => {
        if (draft) {
          if (draft.brainstorm) {
            this.brainstorm.set(draft.brainstorm);
          }
          if (draft.logoUrl) {
            this.logoUrl.set(draft.logoUrl);
            this.hasLogo.set(true);
          }
          if (draft.answers && Array.isArray(draft.answers)) {
            const mapAnswers: Record<string, AnswerValue> = {};
            for (const item of draft.answers) {
              if (item.answer !== null && item.answer !== undefined) {
                mapAnswers[item.questionId] = item.answer;
              }
            }
            this.aiAnswers.set(mapAnswers);
          }
          if (draft.businessName) {
            this.businessName.set(draft.businessName);
          }
          if (draft.slug) {
            this.domain.set(draft.slug);
          }

          if (draft.step === 'brainstormed') {
            this.brainstormAnalyzed.set(true);
            this.aiInterviewSubmitted.set(false);
            this.domainConfirmed.set(false);
          } else if (draft.step === 'answered') {
            this.brainstormAnalyzed.set(true);
            this.aiInterviewSubmitted.set(true);
            this.domainConfirmed.set(false);
          } else if (
            draft.step === 'domain_confirmed' ||
            draft.step === 'themed' ||
            draft.step === 'published'
          ) {
            this.brainstormAnalyzed.set(true);
            this.aiInterviewSubmitted.set(true);
            this.domainConfirmed.set(true);
          }
        }

        if (store) {
          if (store.status === 'live') {
            this.hasLiveStore.set(true);
          }
          if (store.name && !this.businessName()) {
            this.businessName.set(store.name);
          }
          if (store.slug && !this.domain()) {
            this.domain.set(store.slug);
          }
          if (store.logoUrl && !this.logoUrl()) {
            this.logoUrl.set(store.logoUrl);
            this.hasLogo.set(true);
          }
          this.domainConfirmed.set(true);
          this.aiInterviewSubmitted.set(true);
          this.brainstormAnalyzed.set(true);
        }

        const themes = themesRes?.themes ?? [];
        if (themes.length > 0) {
          this.themes.set(themes);
          this.domainConfirmed.set(true);
          this.aiInterviewSubmitted.set(true);
          this.brainstormAnalyzed.set(true);
        }

        this.isHydrated.set(true);
        return this.getHydrationOutcome();
      }),
      catchError(() => {
        return of(this.getHydrationOutcome());
      }),
    );
  }

  getHydrationOutcome(): HydrationOutcome {
    return {
      hasLiveStore: this.hasLiveStore(),
      isThemed: this.themes().length > 0 && this.domainConfirmed(),
      isDomainConfirmed: this.domainConfirmed(),
      isAiInterviewComplete: this.isAiInterviewComplete(),
      isBrainstormComplete: this.isBrainstormComplete(),
    };
  }

  hasBrainstormChanged(text: string, hasNewLogo: boolean): boolean {
    if (hasNewLogo) {
      return true;
    }
    return text.trim() !== this.brainstorm().trim();
  }

  haveAiAnswersChanged(newAnswers: Record<string, AnswerValue>): boolean {
    const current = this.aiAnswers();
    const newKeys = Object.keys(newAnswers);
    const currentKeys = Object.keys(current);

    if (newKeys.length !== currentKeys.length) {
      return true;
    }

    for (const key of newKeys) {
      const valA = newAnswers[key];
      const valB = current[key];
      if (Array.isArray(valA) && Array.isArray(valB)) {
        if (valA.length !== valB.length) {
          return true;
        }
        const sortedA = [...valA].map(String).sort();
        const sortedB = [...valB].map(String).sort();
        for (let i = 0; i < sortedA.length; i++) {
          if (sortedA[i] !== sortedB[i]) {
            return true;
          }
        }
      } else if (valA !== valB) {
        return true;
      }
    }

    return false;
  }

  reset(): void {
    this.brainstorm.set('');
    this.hasLogo.set(false);
    this.logoUrl.set(null);
    this.aiAnswers.set({});
    this.selectedTheme.set('');
    this.businessName.set('');
    this.businessType.set('');
    this.targetAudience.set('');
    this.domain.set('');
    this.themes.set([]);
    this.brainstormAnalyzed.set(false);
    this.aiInterviewSubmitted.set(false);
    this.domainConfirmed.set(false);
    this.aiInterviewStepIndex.set(0);
    this.isHydrated.set(false);
    this.hasLiveStore.set(false);
  }

  /**
   * Primes the questionnaire from the backend. Must be called after the auth
   * token has been set (i.e. after a successful login/register) so that the
   * authenticated GET /site-builder/questions request does not get a 401.
   * The bundled INTERVIEW_QUESTIONS list stands in until this resolves and
   * also acts as the fallback if the request fails.
   */
  loadQuestions(): void {
    this.questionsApi.getQuestions().subscribe((response) => {
      if (response?.questions?.length) this.questions.set(response.questions);
    });
  }
}
