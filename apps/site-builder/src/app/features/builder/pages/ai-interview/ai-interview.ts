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
import { Router } from '@angular/router';
import { CdkStepper, StepperSelectionEvent } from '@angular/cdk/stepper';
import { PageHeader } from '@/app/shared/components/page-header/page-header';
import { BuilderState } from '@/app/features/builder/services/builder-state';
import { hlmP } from '@spartan/helm/typography';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmInputImports } from '@spartan/helm/input';
import { SpartanStepperImports } from '@/spartan/stepper';
import { TranslatePipe, LocaleService } from '@invento/core';
import { toast } from '@spartan/helm/sonner';
import { AiInterviewApi, SubmitAnswersPayload } from '../../services/ai-interview-api';
import { decodeAnswer, encodeAnswer, isAnswered } from '../../utils/answer-codec';
import { toastApiError } from '@/app/shared/utils/toast-api-error';

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
  protected readonly hlmP = hlmP;

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

  form = new FormGroup({});
  selectedChannels = signal<Record<string, string[]>>({});

  constructor() {
    // Focus the first question as soon as the stepper has rendered, so the
    // page opens ready to type. `write` rather than `read`, because focusing
    // mutates the document; the old `read` callback also queried the whole
    // component and could land on a control belonging to another step.
    afterNextRender({
      write: () => this.focusStepInput(this.stepper()?.selectedIndex ?? 0),
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

  /**
   * Focuses the first control of a step without moving the viewport, so it
   * can be paired with an explicit scroll rather than fighting it.
   */
  private focusStepInput(index: number): void {
    const step = document.querySelectorAll('[cdkstepcontent], cdk-step')[index];
    step
      ?.querySelector<HTMLElement>('input, textarea, button, [tabindex="0"]')
      ?.focus({ preventScroll: true });
  }

  scrollToStep(index: number) {
    const step = document.querySelectorAll('[cdkstepcontent], cdk-step')[index];
    if (!step) return;

    step.scrollIntoView({ behavior: 'smooth', block: 'center' });
    this.focusStepInput(index);
  }

  onSelectionChange(event: StepperSelectionEvent) {
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
    stepper.selectedIndex = stepper.selectedIndex - 1;
    this.scrollToStep(stepper.selectedIndex);
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
    stepper.selectedIndex = stepper.selectedIndex + 1;
    this.scrollToStep(stepper.selectedIndex);
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
      next: (res) => {
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
      this.stepper()?.next();
    }
  }
}
