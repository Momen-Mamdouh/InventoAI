import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HlmBadgeImports } from '@spartan/helm/badge';
import { HlmButtonImports } from '@spartan/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroBolt,
  heroArrowRight,
  heroXMark,
  heroArrowsPointingOut,
  heroCheck,
} from '@ng-icons/heroicons/outline';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  lucideDot,
  lucideImagePlus,
  lucideUploadCloud,
  lucideAlertTriangle,
  lucideInfo,
  lucideLoader2,
} from '@ng-icons/lucide';
import { PageHeader } from '@/app/shared/components/page-header/page-header';
import { BuilderState } from '@/app/features/builder/services/builder-state';
import { BrainstormApi } from '@/app/features/builder/services/brainstorm-api';
import { hlmH2, hlmP } from '@spartan/helm/typography';
import { DoubleSlash } from '@invento/shared';
import { toast } from '@spartan/helm/sonner';
import { Router } from '@angular/router';
import { TranslatePipe, LocaleService } from '@invento/core';
import { HlmTextareaImports } from '@spartan/helm/textarea';
import { HlmItemImports } from '@spartan/helm/item';
import { MIN_BRAINSTORM_LENGTH } from '@/app/features/builder/constants/builder-steps';
import { toastApiError } from '@/app/shared/utils/toast-api-error';

type ValidationStatus = 'EMPTY' | 'TOO_SHORT' | 'MEANINGLESS' | 'VALID';

interface ContextChecklist {
  id: number;
  content: string;
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Component({
  selector: 'app-brainstorm',
  imports: [
    HlmBadgeImports,
    HlmTextareaImports,
    HlmButtonImports,
    NgIcon,
    HlmItemImports,
    ReactiveFormsModule,
    PageHeader,
    DoubleSlash,
    TranslatePipe,
  ],
  templateUrl: './brainstorm.html',
  styleUrl: './brainstorm.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      heroBolt,
      heroArrowRight,
      heroXMark,
      heroArrowsPointingOut,
      lucideDot,
      lucideImagePlus,
      lucideUploadCloud,
      lucideAlertTriangle,
      lucideInfo,
      lucideLoader2,
      heroCheck,
    }),
  ],
})
export class Brainstorm implements OnInit {
  protected readonly MIN_DESCRIPTION_LENGTH = MIN_BRAINSTORM_LENGTH;

  private readonly builderState = inject(BuilderState);
  private readonly brainstormApi = inject(BrainstormApi);
  private readonly router = inject(Router);
  private readonly localeService = inject(LocaleService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly hlmH2 = hlmH2;
  protected readonly hlmP = hlmP;

  logoFile = signal<File | null>(null);
  logoPreview = signal<string | null>(null);
  isDragging = signal<boolean>(false);
  isFocused = signal<boolean>(false);
  readonly isSubmitting = signal(false);

  readonly descriptionControl = new FormControl(this.builderState.brainstorm() || '', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(MIN_BRAINSTORM_LENGTH)],
  });

  /** Mirrors the control's value so validation is computed once per change, not per CD cycle. */
  private readonly description = toSignal(this.descriptionControl.valueChanges, {
    initialValue: this.builderState.brainstorm() || '',
  });

  protected readonly backdropClass = computed(() =>
    this.isFocused()
      ? 'fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm'
      : '',
  );

  readonly validationStatus = computed<ValidationStatus>(() => {
    const trimmed = (this.description() || '').trim();
    if (trimmed.length === 0) return 'EMPTY';
    if (trimmed.length < MIN_BRAINSTORM_LENGTH) return 'TOO_SHORT';

    // Guard against padding the box with repeated characters to clear the
    // length check — the AI needs actual words to work with.
    const words = trimmed.split(/\s+/).filter((w) => w.length >= 2);
    if (words.length < 3) return 'MEANINGLESS';

    const uniqueChars = new Set(trimmed.replace(/\s+/g, '').toLowerCase());
    if (uniqueChars.size < 4) return 'MEANINGLESS';

    return 'VALID';
  });

  readonly isValidConcept = computed(() => this.validationStatus() === 'VALID');
  readonly hasValidLogo = computed(() =>
    Boolean(
      this.logoFile() ||
      this.logoPreview() ||
      this.builderState.logoUrl() ||
      this.builderState.hasLogo(),
    ),
  );

  readonly canSubmit = computed(
    () => this.isValidConcept() && this.hasValidLogo() && !this.isSubmitting(),
  );

  contextChecklist: ContextChecklist[] = [
    { id: 1, content: 'brainstorm_check_1' },
    { id: 2, content: 'brainstorm_check_2' },
    { id: 3, content: 'brainstorm_check_3' },
    { id: 4, content: 'brainstorm_check_4' },
  ];

  ngOnInit() {
    const saved = this.builderState.brainstorm();
    if (saved && this.descriptionControl.value !== saved) {
      this.descriptionControl.setValue(saved);
    }

    this.descriptionControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => this.builderState.brainstorm.set(val));

    const savedLogo = this.builderState.logoUrl();
    if (savedLogo) {
      this.logoPreview.set(savedLogo);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isFocused()) {
      this.isFocused.set(false);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleFile(file);
  }

  private handleFile(file: File) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(this.localeService.translate('toast_invalid_image'));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(this.localeService.translate('toast_file_size'));
      return;
    }

    this.logoFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.logoPreview.set(dataUrl);
      this.builderState.logoUrl.set(dataUrl);
    };
    reader.readAsDataURL(file);
    this.builderState.hasLogo.set(true);
  }

  removeLogo() {
    this.logoFile.set(null);
    this.logoPreview.set(null);
    this.builderState.hasLogo.set(false);
    this.builderState.logoUrl.set(null);
  }

  onNext() {
    if (!this.isValidConcept() || !this.hasValidLogo() || this.isSubmitting()) {
      if (!this.hasValidLogo()) {
        toast.error(this.localeService.translate('brainstorm_logo_required'));
      }
      return;
    }

    const text = this.descriptionControl.value;
    this.builderState.brainstorm.set(text);

    this.isSubmitting.set(true);
    const toastId = toast.loading(this.localeService.translate('toast_analyzing_prompt'));

    this.brainstormApi.analyzePrompt(text, this.logoFile() || undefined).subscribe({
      next: (response) => {
        toast.success(this.localeService.translate('toast_prompt_success'), { id: toastId });

        const prefill: Record<string, string | number | string[] | number[]> = {};
        for (const q of response?.questions ?? []) {
          if (q.answer !== null && q.answer !== undefined) {
            prefill[q.questionId] = q.answer;
          }
        }

        this.builderState.aiAnswers.set(prefill);
        this.isSubmitting.set(false);
        // Marks the step done for the wizard guards; only a successful
        // analyzePrompt round trip may open the next step.
        this.builderState.brainstormAnalyzed.set(true);
        this.router.navigate(['/build/ai-interview']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        toastApiError(err, 'toast_prompt_failed', this.localeService, toastId);
      },
    });
  }

  public isRtl(): boolean {
    return this.localeService.isRtl();
  }
}
