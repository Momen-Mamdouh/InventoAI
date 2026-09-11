import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  effect,
  signal,
  inject,
  viewChild,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucideMessageSquare,
  lucideLoader2,
  lucideCheck,
  lucideSparkles,
  lucideInfo,
  lucideCircleAlert,
} from '@ng-icons/lucide';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { HlmButton } from '@spartan/helm/button';
import { HlmTextarea } from '@spartan/helm/textarea';
import { HlmSeparator } from '@spartan/helm/separator';
import { Router } from '@angular/router';
import { CdkStepper, StepperSelectionEvent } from '@angular/cdk/stepper';
import { PageHeader } from '@invento/shared-ui-page-header';
import { BuilderState } from '@invento/site-builder-data-access-builder';
import { HlmSmall } from '@spartan/helm/typography';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmInputImports } from '@spartan/helm/input';
import { SpartanStepperImports } from '@spartan/helm/stepper';
import { ActionButton } from '@invento/shared-ui-action-button';
import { TranslatePipe, LocaleService } from '@invento/shared-util-i18n';
import { toast } from '@spartan/helm/sonner';
import { AiInterviewApi, SubmitAnswersPayload, withMinDuration } from '@invento/site-builder-data-access-builder';
import { decodeAnswer, encodeAnswer, isAnswered } from '../../utils/answer-codec';
import { toastApiError } from '../../utils/toast-api-error';

@Component({
  selector: 'app-ai-interview',
  imports: [
    NgIconComponent,
    HlmButton,
    HlmTextarea,
    HlmLabelImports,
    HlmInputImports,
    HlmSeparator,
    ReactiveFormsModule,
    PageHeader,
    SpartanStepperImports,
    TranslatePipe,
    HlmSmall,
    ActionButton,
  ],
  providers: [
    provideIcons({
      lucideMessageSquare,
      lucideChevronLeft,
      lucideChevronRight,
      lucideLoader2,
      lucideCheck,
      lucideSparkles,
      lucideInfo,
      lucideCircleAlert,
    }),
  ],
  templateUrl: './ai-interview.html',
  styleUrl: './ai-interview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiInterview implements OnInit {
  private readonly builderState = inject(BuilderState);
  private readonly router = inject(Router);
  private readonly _localeService = inject(LocaleService);
  private readonly aiInterviewApi = inject(AiInterviewApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly invalidQuestionIds = signal<string[]>([]);
  readonly initialAiAnswers = signal<Record<string, unknown>>({});

  protected readonly chevronBack = computed(() =>
    this._localeService.isRtl() ? 'lucideChevronRight' : 'lucideChevronLeft',
  );
  protected readonly chevronNext = computed(() =>
    this._localeService.isRtl() ? 'lucideChevronLeft' : 'lucideChevronRight',
  );

  readonly stepper = viewChild<CdkStepper>('stepper');

  readonly visibleQuestions = computed(() => {
    const hasLogo = this.builderState.hasLogo();
    // The catalog comes from GET /site-builder/questions; BuilderState primes
    // it at startup and falls back to the bundled list only when offline.
    return this.builderState.questions().filter((q) => q.showWhen !== 'logoUploaded' || hasLogo);
  });

  readonly currentStepIndex = computed(() => {
    const total = this.visibleQuestions().length;
    if (total === 0) return 0;
    const saved = this.builderState.aiInterviewStepIndex();
    return Math.min(Math.max(0, saved), total - 1);
  });

  private scrollTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private focusTimeoutId: ReturnType<typeof setTimeout> | null = null;

  form = new FormGroup({});
  selectedChannels = signal<Record<string, string[]>>({});

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.scrollTimeoutId) {
        clearTimeout(this.scrollTimeoutId);
      }
      if (this.focusTimeoutId) {
        clearTimeout(this.focusTimeoutId);
      }
    });

    // Focus the active question as soon as the stepper has rendered, so the
    // page opens ready to type at the user's last visited question.
    afterNextRender({
      write: () => {
        const index = this.currentStepIndex();
        const stepper = this.stepper();
        if (stepper && stepper.selectedIndex !== index) {
          stepper.selectedIndex = index;
        }
        this.scrollToStep(index, true);
      },
    });

    // React to top steps bar or step guard enforcement when user attempts to skip ahead
    effect(() => {
      const event = this.builderState.stepEnforcement();
      if (event && event.stepId === 'ai-interview') {
        const invalidIds = this.findAllInvalidQuestionIds();
        if (invalidIds.length > 0) {
          this.invalidQuestionIds.set(invalidIds);
          this.form.markAllAsTouched();
          const firstIndex = this.visibleQuestions().findIndex((q) => q.id === invalidIds[0]);
          if (firstIndex !== -1) {
            const stepper = this.stepper();
            if (stepper) {
              stepper.selectedIndex = firstIndex;
            }
            this.builderState.aiInterviewStepIndex.set(firstIndex);
            this.scrollToStep(firstIndex);
          }
        }
      }
    });
  }

  ngOnInit(): void {
    const prefill = this.builderState.aiAnswers();
    this.initialAiAnswers.set({ ...prefill });

    this.visibleQuestions().forEach((q) => {
      const initialValue = decodeAnswer(q, prefill[q.id]);

      if (q.type === 'multi') {
        this.selectedChannels.update((prev) => ({ ...prev, [q.id]: initialValue as string[] }));
      }

      this.form.addControl(
        q.id,
        new FormControl(initialValue, q.required ? [Validators.required] : []),
      );
    });

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      this.builderState.aiAnswers.update((current) => ({ ...current, ...val }));
      for (const [key, value] of Object.entries(val)) {
        const q = this.visibleQuestions().find((item) => item.id === key);
        if (q && isAnswered(q, value)) {
          this.invalidQuestionIds.update((prev) => prev.filter((id) => id !== key));
        }
      }
    });
  }

  private getStepContainer(index: number): HTMLElement | null {
    const stepper = this.stepper();
    if (stepper) {
      const labelId = stepper._getStepLabelId(index);
      const header = document.getElementById(labelId);
      if (header?.parentElement) {
        return header.parentElement;
      }
      const contentId = stepper._getStepContentId(index);
      const section = document.getElementById(contentId);
      if (section) {
        return (section.closest('.flex.flex-col.gap-2') as HTMLElement) ?? section;
      }
    }
    const allSteps = document.querySelectorAll('spartan-stepper .flex.flex-col.gap-2');
    return (allSteps[index] as HTMLElement) ?? null;
  }

  /**
   * Focuses the first control of a step without moving the viewport, so it
   * can be paired with an explicit scroll rather than fighting it.
   */
  private focusStepInput(index: number): void {
    const container = this.getStepContainer(index);
    if (!container) return;

    const target =
      container.querySelector<HTMLElement>(
        'textarea, input:not([type="hidden"]), [tabindex="0"]',
      ) ?? container.querySelector<HTMLElement>('button');
    target?.focus({ preventScroll: true });
  }

  scrollToStep(index: number, immediate = false): void {
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
      this.scrollTimeoutId = null;
    }

    const runScroll = () => {
      const container = this.getStepContainer(index);
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const topNavOffset = 96; // 80px floating navbar + 16px safety margin
      const bottomBarOffset = 80; // sticky bottom action bar
      const visibleHeight = window.innerHeight - topNavOffset - bottomBarOffset;

      if (rect.height > visibleHeight) {
        // Question is taller than safe visible area: scroll so top sits below navbar
        const targetY = window.scrollY + rect.top - topNavOffset;
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: immediate ? 'auto' : 'smooth',
        });
      } else {
        // Center the question container in the viewport
        container.scrollIntoView({
          behavior: immediate ? 'auto' : 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }

      if (this.focusTimeoutId) {
        clearTimeout(this.focusTimeoutId);
      }
      this.focusTimeoutId = setTimeout(() => this.focusStepInput(index), 350);
    };

    if (immediate) {
      runScroll();
    } else {
      this.scrollTimeoutId = setTimeout(runScroll, 150);
    }
  }

  onSelectionChange(event: StepperSelectionEvent): void {
    this.builderState.aiInterviewStepIndex.set(event.selectedIndex);
    this.scrollToStep(event.selectedIndex);
  }

  onPrevStep(): void {
    const stepper = this.stepper();
    if (!stepper) {
      return;
    }
    if (stepper.selectedIndex === 0) {
      this.router.navigate(['/build/brainstorm']);
      return;
    }
    const prevIndex = stepper.selectedIndex - 1;
    stepper.selectedIndex = prevIndex;
    this.builderState.aiInterviewStepIndex.set(prevIndex);
  }

  onNextStep(): void {
    const stepper = this.stepper();
    if (!stepper) return;

    const currentIndex = stepper.selectedIndex;
    if (currentIndex >= this.visibleQuestions().length - 1) {
      // Last step: trigger submit
      this.onNext();
      return;
    }

    const currentQuestion = this.visibleQuestions()[currentIndex];
    if (currentQuestion && currentQuestion.required) {
      const control = this.form.get(currentQuestion.id);
      if (control && (control.invalid || !isAnswered(currentQuestion, control.value))) {
        control.markAsTouched();
        this.invalidQuestionIds.update((prev) => Array.from(new Set([...prev, currentQuestion.id])));
        toast.error(this._localeService.translate('toast_required_questions'));
        return;
      }
    }

    if (currentQuestion) {
      this.invalidQuestionIds.update((prev) => prev.filter((id) => id !== currentQuestion.id));
    }

    const nextIndex = currentIndex + 1;
    stepper.selectedIndex = nextIndex;
    this.builderState.aiInterviewStepIndex.set(nextIndex);
  }

  isQuestionCompleted(questionId: string): boolean {
    const control = this.form.get(questionId);
    const question = this.visibleQuestions().find((item) => item.id === questionId);
    if (!question || !control) return false;
    if (!question.required) return true;
    return isAnswered(question, control.value) && control.valid;
  }

  isQuestionInvalid(questionId: string): boolean {
    return this.invalidQuestionIds().includes(questionId);
  }

  isChannelSelected(questionId: string, option: string): boolean {
    return this.selectedChannels()[questionId]?.includes(option) ?? false;
  }

  isQuestionAnswered(questionId: string): boolean {
    const question = this.visibleQuestions().find((item) => item.id === questionId);
    if (!question) return false;
    const control = this.form.get(questionId);
    return isAnswered(question, control?.value);
  }

  isAiSuggested(questionId: string, option: string): boolean {
    const initial = this.initialAiAnswers()[questionId];
    if (initial === undefined || initial === null) return false;
    if (Array.isArray(initial)) {
      return initial.includes(option);
    }
    return String(initial) === option;
  }

  onSingleSelect(questionId: string, option: string): void {
    const control = this.form.get(questionId);
    control?.setValue(option);
    control?.markAsTouched();
    this.invalidQuestionIds.update((prev) => prev.filter((id) => id !== questionId));
  }

  /** Find all visible required questions that are currently unanswered or invalid. */
  findAllInvalidQuestionIds(): string[] {
    return this.visibleQuestions()
      .filter((q) => {
        if (!q.required) return false;
        const control = this.form.get(q.id);
        return !isAnswered(q, control?.value) || (control?.invalid ?? false);
      })
      .map((q) => q.id);
  }

  /** Index of the first visible question still missing a required answer, or -1. */
  findFirstInvalidQuestionIndex(): number {
    return this.visibleQuestions().findIndex((q) => {
      const control = this.form.get(q.id);
      if (!q.required) return control?.invalid ?? false;
      return !isAnswered(q, control?.value) || (control?.invalid ?? false);
    });
  }

  toggleMultiSelect(questionId: string, option: string): void {
    this.selectedChannels.update((current) => {
      const selected = current[questionId] || [];
      const updated = selected.includes(option)
        ? selected.filter((c) => c !== option)
        : [...selected, option];

      return { ...current, [questionId]: updated };
    });

    const control = this.form.get(questionId);
    const updatedValues = this.selectedChannels()[questionId];
    control?.setValue(updatedValues);
    control?.markAsTouched();

    if (updatedValues && updatedValues.length > 0) {
      this.invalidQuestionIds.update((prev) => prev.filter((id) => id !== questionId));
    }
  }

  canSubmit(): boolean {
    if (!this.form.valid) return false;
    return this.visibleQuestions().every(
      (q) => !q.required || isAnswered(q, this.form.get(q.id)?.value),
    );
  }

  onNext(): void {
    const invalidIds = this.findAllInvalidQuestionIds();
    if (invalidIds.length > 0) {
      this.invalidQuestionIds.set(invalidIds);
      this.form.markAllAsTouched();

      const firstInvalidIndex = this.visibleQuestions().findIndex((q) => q.id === invalidIds[0]);
      const stepper = this.stepper();
      if (stepper && firstInvalidIndex !== -1) {
        stepper.selectedIndex = firstInvalidIndex;
        this.builderState.aiInterviewStepIndex.set(firstInvalidIndex);
        this.scrollToStep(firstInvalidIndex);
      }
      toast.error(this._localeService.translate('toast_required_questions'));
      return;
    }

    this.invalidQuestionIds.set([]);

    if (!this.canSubmit() || this.isSubmitting()) {
      this.form.markAllAsTouched();
      toast.error(this._localeService.translate('toast_required_questions'));
      return;
    }

    const raw = this.form.value as Record<string, string | string[]>;

    const hasChanged = this.builderState.haveAiAnswersChanged(raw);
    if (this.builderState.aiInterviewSubmitted() && !hasChanged) {
      toast.info(this._localeService.translate('interview_resumed_notice'));
      this.router.navigate(['/build/validation']);
      return;
    }

    this.builderState.aiAnswers.update((current) => ({ ...current, ...raw }));

    if (raw['q1']) {
      this.builderState.businessName.set(raw['q1'] as string);
    }

    this.isSubmitting.set(true);
    this.builderState.startTransition(this._localeService.translate('toast_saving_answers'));

    const payload: SubmitAnswersPayload = {
      questions: this.visibleQuestions().map((q) => ({
        questionId: q.id,
        answer: encodeAnswer(q, this.form.get(q.id)?.value),
      })),
    };

    withMinDuration(this.aiInterviewApi.submitAnswers(payload), 900).subscribe({
      next: () => {
        this.builderState.aiInterviewSubmitted.set(true);
        this.isSubmitting.set(false);
        this.router.navigate(['/build/validation']);
        this.builderState.stopTransition();
        toast.success(this._localeService.translate('toast_answers_success'));
      },
      error: (err) => {
        this.builderState.stopTransition();
        this.isSubmitting.set(false);
        toastApiError(err, 'toast_answers_failed', this._localeService);
      },
    });
  }

  onInputEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.onNextStep();
    }
  }
}
