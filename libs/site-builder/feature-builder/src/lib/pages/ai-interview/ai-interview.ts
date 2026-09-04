import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
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
} from '@ng-icons/lucide';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { HlmButton } from '@spartan/helm/button';
import { HlmTextarea } from '@spartan/helm/textarea';
import { HlmSeparator } from '@spartan/helm/separator';
import { HlmSpinner } from '@spartan/helm/spinner';
import { Router } from '@angular/router';
import { CdkStepper, StepperSelectionEvent } from '@angular/cdk/stepper';
import { PageHeader } from '@invento/shared-ui-page-header';
import { BuilderState } from '@invento/site-builder-data-access-builder';
import { HlmSmall } from '@spartan/helm/typography';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmInputImports } from '@spartan/helm/input';
import { SpartanStepperImports } from '@spartan/helm/stepper';
import { TranslatePipe, LocaleService } from '@invento/shared-util-i18n';
import { toast } from '@spartan/helm/sonner';
import { AiInterviewApi, SubmitAnswersPayload } from '@invento/site-builder-data-access-builder';
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
    HlmSpinner,
    ReactiveFormsModule,
    PageHeader,
    SpartanStepperImports,
    TranslatePipe,
    HlmSmall,
  ],
  providers: [
    provideIcons({
      lucideMessageSquare,
      lucideChevronLeft,
      lucideChevronRight,
      lucideLoader2,
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
  readonly invalidQuestionId = signal<string | null>(null);

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

  form = new FormGroup({});
  selectedChannels = signal<Record<string, string[]>>({});

  constructor() {
    // Focus the active question as soon as the stepper has rendered, so the
    // page opens ready to type at the user's last visited question.
    afterNextRender({
      write: () => {
        const index = this.currentStepIndex();
        const stepper = this.stepper();
        if (stepper && stepper.selectedIndex !== index) {
          stepper.selectedIndex = index;
        }
        this.scrollToStep(index);
      },
    });
  }

  ngOnInit() {
    const prefill = this.builderState.aiAnswers();

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
    });
  }

  private getStepElement(index: number): HTMLElement | null {
    const stepper = this.stepper();
    if (stepper) {
      const contentId = stepper._getStepContentId(index);
      const section = document.getElementById(contentId);
      if (section) return section;
    }
    const sections = document.querySelectorAll('spartan-stepper section[role="region"]');
    return (sections[index] as HTMLElement) ?? null;
  }

  /**
   * Focuses the first control of a step without moving the viewport, so it
   * can be paired with an explicit scroll rather than fighting it.
   */
  private focusStepInput(index: number): void {
    const step = this.getStepElement(index);
    if (!step) return;

    const target =
      step.querySelector<HTMLElement>('textarea, input:not([type="hidden"]), [tabindex="0"]') ??
      step.querySelector<HTMLElement>('button');
    target?.focus({ preventScroll: true });
  }

  scrollToStep(index: number) {
    const step = this.getStepElement(index);
    if (!step) return;

    const container = step.closest('.flex.flex-col.gap-2') || step;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => this.focusStepInput(index), 50);
  }

  onSelectionChange(event: StepperSelectionEvent) {
    this.builderState.aiInterviewStepIndex.set(event.selectedIndex);
    this.scrollToStep(event.selectedIndex);
  }

  onPrevStep() {
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
    this.scrollToStep(prevIndex);
  }

  onNextStep() {
    const stepper = this.stepper();
    if (!stepper) return;

    const currentQuestion = this.visibleQuestions()[stepper.selectedIndex];
    if (currentQuestion && currentQuestion.required) {
      const control = this.form.get(currentQuestion.id);
      if (control && (control.invalid || !isAnswered(currentQuestion, control.value))) {
        control.markAsTouched();
        this.invalidQuestionId.set(currentQuestion.id);
        toast.error(this._localeService.translate('toast_required_questions'));
        return;
      }
    }

    this.invalidQuestionId.set(null);
    const nextIndex = stepper.selectedIndex + 1;
    stepper.selectedIndex = nextIndex;
    this.builderState.aiInterviewStepIndex.set(nextIndex);
    this.scrollToStep(nextIndex);
  }

  isQuestionCompleted(questionId: string): boolean {
    const control = this.form.get(questionId);
    const question = this.visibleQuestions().find((item) => item.id === questionId);
    if (!question || !control) return false;
    if (!question.required) return true;
    return isAnswered(question, control.value) && control.valid;
  }

  isQuestionInvalid(questionId: string): boolean {
    if (this.invalidQuestionId() === questionId) return true;

    const control = this.form.get(questionId);
    if (!control?.touched) return false;

    const question = this.visibleQuestions().find((item) => item.id === questionId);
    return question ? !isAnswered(question, control.value) : false;
  }

  /** Index of the first visible question still missing a required answer, or -1. */
  findFirstInvalidQuestionIndex(): number {
    return this.visibleQuestions().findIndex((q) => {
      const control = this.form.get(q.id);
      if (!q.required) return control?.invalid ?? false;
      return !isAnswered(q, control?.value) || (control?.invalid ?? false);
    });
  }

  toggleMultiSelect(questionId: string, option: string) {
    this.selectedChannels.update((current) => {
      const selected = current[questionId] || [];
      const updated = selected.includes(option)
        ? selected.filter((c) => c !== option)
        : [...selected, option];

      return { ...current, [questionId]: updated };
    });

    const control = this.form.get(questionId);
    control?.setValue(this.selectedChannels()[questionId]);
    control?.markAsTouched();

    if (this.invalidQuestionId() === questionId) {
      this.invalidQuestionId.set(null);
    }
  }

  canSubmit(): boolean {
    if (!this.form.valid) return false;
    return this.visibleQuestions().every(
      (q) => !q.required || isAnswered(q, this.form.get(q.id)?.value),
    );
  }

  onNext() {
    const invalidIndex = this.findFirstInvalidQuestionIndex();
    if (invalidIndex !== -1) {
      this.invalidQuestionId.set(this.visibleQuestions()[invalidIndex].id);
      this.form.markAllAsTouched();

      const stepper = this.stepper();
      if (stepper) stepper.selectedIndex = invalidIndex;
      this.builderState.aiInterviewStepIndex.set(invalidIndex);
      this.scrollToStep(invalidIndex);
      toast.error(this._localeService.translate('toast_required_questions'));
      return;
    }

    this.invalidQuestionId.set(null);

    if (!this.canSubmit() || this.isSubmitting()) {
      this.form.markAllAsTouched();
      toast.error(this._localeService.translate('toast_required_questions'));
      return;
    }

    const raw = this.form.value as Record<string, string | string[]>;
    this.builderState.aiAnswers.update((current) => ({ ...current, ...raw }));

    if (raw['q1']) {
      this.builderState.businessName.set(raw['q1'] as string);
    }

    this.isSubmitting.set(true);
    const toastId = toast.loading(this._localeService.translate('toast_saving_answers'));

    const payload: SubmitAnswersPayload = {
      questions: this.visibleQuestions().map((q) => ({
        questionId: q.id,
        answer: encodeAnswer(q, this.form.get(q.id)?.value),
      })),
    };

    this.aiInterviewApi.submitAnswers(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);

        toast.success(this._localeService.translate('toast_answers_success'), { id: toastId });

        // Answers alone never complete this step — the wizard guards require
        // that submitAnswers actually reached the backend.
        this.builderState.aiInterviewSubmitted.set(true);
        this.router.navigate(['/build/validation']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        toastApiError(err, 'toast_answers_failed', this._localeService, toastId);
      },
    });
  }

  onInputEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.onNextStep();
    }
  }
}
