import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideDot,
  lucideImagePlus,
  lucideUploadCloud,
  lucideAlertTriangle,
  lucideInfo,
  lucideLoader2,
  lucideSparkles,
  lucideShirt,
  lucideLaptop,
  lucideCoffee,
  lucideMaximize2,
  lucideMinimize2,
  lucideTrash2,
  lucideRefreshCw,
  lucideCheckCircle2,
  lucideFileText,
  lucideClock,
  lucideType,
  lucideCheck,
  lucideCircle,
  lucideArrowRight,
  lucideZap,
  lucideX,
} from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan/helm/badge';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmTextareaImports } from '@spartan/helm/textarea';
import { HlmProgressImports } from '@spartan/helm/progress';
import { HlmDialogImports } from '@spartan/helm/dialog';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { toast } from '@spartan/helm/sonner';
import { PageHeader } from '@invento/shared-ui-page-header';
import { ActionButton } from '@invento/shared-ui-action-button';
import { TranslatePipe, LocaleService } from '@invento/shared-util-i18n';
import {
  BuilderState,
  BrainstormApi,
  MIN_BRAINSTORM_LENGTH,
} from '@invento/site-builder-data-access-builder';
import { toastApiError } from '../../utils/toast-api-error';

type ValidationStatus = 'EMPTY' | 'TOO_SHORT' | 'MEANINGLESS' | 'VALID';

interface ContextChecklist {
  id: number;
  content: string;
}

interface StarterChip {
  id: string;
  icon: string;
  labelKey: string;
  snippetKey: string;
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Component({
  selector: 'app-brainstorm',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIcon,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmTextareaImports,
    HlmProgressImports,
    HlmDialogImports,
    BrnDialogImports,
    PageHeader,
    TranslatePipe,
    ActionButton,
  ],
  templateUrl: './brainstorm.html',
  styleUrl: './brainstorm.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideDot,
      lucideImagePlus,
      lucideUploadCloud,
      lucideAlertTriangle,
      lucideInfo,
      lucideLoader2,
      lucideSparkles,
      lucideShirt,
      lucideLaptop,
      lucideCoffee,
      lucideMaximize2,
      lucideMinimize2,
      lucideTrash2,
      lucideRefreshCw,
      lucideCheckCircle2,
      lucideFileText,
      lucideClock,
      lucideType,
      lucideCheck,
      lucideCircle,
      lucideArrowRight,
      lucideZap,
      lucideX,
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

  readonly logoFile = signal<File | null>(null);
  readonly logoPreview = signal<string | null>(null);
  readonly isDragging = signal<boolean>(false);
  readonly isFocused = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly highlightErrorElement = signal<'desc' | 'logo' | 'initiate' | null>(null);

  readonly starterChips: StarterChip[] = [
    {
      id: 'fashion',
      icon: 'lucideShirt',
      labelKey: 'chip_fashion',
      snippetKey: 'chip_fashion_text',
    },
    {
      id: 'tech',
      icon: 'lucideLaptop',
      labelKey: 'chip_tech',
      snippetKey: 'chip_tech_text',
    },
    {
      id: 'coffee',
      icon: 'lucideCoffee',
      labelKey: 'chip_coffee',
      snippetKey: 'chip_coffee_text',
    },
  ];

  readonly contextChecklist: ContextChecklist[] = [
    { id: 1, content: 'brainstorm_check_1' },
    { id: 2, content: 'brainstorm_check_2' },
    { id: 3, content: 'brainstorm_check_3' },
    { id: 4, content: 'brainstorm_check_4' },
  ];

  readonly descriptionControl = new FormControl(this.builderState.brainstorm() || '', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(MIN_BRAINSTORM_LENGTH)],
  });

  private readonly description = toSignal(this.descriptionControl.valueChanges, {
    initialValue: this.builderState.brainstorm() || '',
  });

  readonly charCount = computed(() => (this.description() || '').trim().length);

  readonly wordCount = computed(() => {
    const trimmed = (this.description() || '').trim();
    if (!trimmed) {
      return 0;
    }
    return trimmed.split(/\s+/).length;
  });

  readonly readingTime = computed(() => Math.max(1, Math.ceil(this.wordCount() / 200)));

  readonly progressValue = computed(() => {
    const chars = this.charCount();
    return Math.min(100, Math.round((chars / 120) * 100));
  });

  readonly validationStatus = computed<ValidationStatus>(() => {
    const trimmed = (this.description() || '').trim();
    if (trimmed.length === 0) {
      return 'EMPTY';
    }
    if (trimmed.length < MIN_BRAINSTORM_LENGTH) {
      return 'TOO_SHORT';
    }

    const words = trimmed.split(/\s+/).filter((w) => w.length >= 2);
    if (words.length < 3) {
      return 'MEANINGLESS';
    }

    const uniqueChars = new Set(trimmed.replace(/\s+/g, '').toLowerCase());
    if (uniqueChars.size < 4) {
      return 'MEANINGLESS';
    }

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

  readonly checklistFulfillment = computed<Record<number, boolean>>(() => {
    const text = (this.description() || '').toLowerCase();
    if (!text.trim()) {
      return { 1: false, 2: false, 3: false, 4: false };
    }

    const typeKeywords = [
      'brand', 'store', 'shop', 'selling', 'product', 'service', 'digital', 'physical',
      '\u0645\u062A\u062C\u0631', '\u0639\u0644\u0627\u0645\u0629', '\u0645\u0627\u0631\u0643\u0629', '\u0645\u0646\u062A\u062C', '\u062E\u062F\u0645\u0629', '\u0628\u064A\u0639',
    ];
    const hasType = typeKeywords.some((k) => text.includes(k)) || text.length > 20;

    const audienceKeywords = [
      'target', 'audience', 'customer', 'buyers', 'users', 'men', 'women', 'kids', 'gen', 'people',
      '\u062C\u0645\u0647\u0648\u0631', '\u0639\u0645\u0644\u0627\u0621', '\u0645\u0633\u062A\u0647\u0644\u0643', '\u0634\u0628\u0627\u0628', '\u0646\u0633\u0627\u0621', '\u0631\u062C\u0627\u0644', '\u0641\u0626\u0629',
    ];
    const hasAudience = audienceKeywords.some((k) => text.includes(k));

    const priceKeywords = [
      'price', 'tier', 'budget', 'affordable', 'premium', 'luxury', 'cheap', 'high-end',
      '\u0633\u0639\u0631', '\u0627\u0642\u062A\u0635\u0627\u062F\u064A', '\u0641\u0627\u062E\u0631', '\u0645\u062A\u0648\u0633\u0637', '\u0631\u062E\u064A\u0635', '\u0628\u0627\u0647\u0638',
    ];
    const hasPrice = priceKeywords.some((k) => text.includes(k));

    const personalityKeywords = [
      'tone', 'vibe', 'personality', 'modern', 'minimal', 'bold', 'sleek', 'color', 'style', 'palette',
      '\u0639\u0635\u0631\u064A', '\u0623\u0644\u0648\u0627\u0646', '\u0637\u0627\u0628\u0639', '\u0623\u0633\u0644\u0648\u0628', '\u0647\u0627\u062F\u0626', '\u062D\u064A\u0648\u064A',
    ];
    const hasPersonality = personalityKeywords.some((k) => text.includes(k));

    return {
      1: hasType,
      2: hasAudience,
      3: hasPrice,
      4: hasPersonality,
    };
  });

  readonly fulfilledCount = computed(() => {
    const f = this.checklistFulfillment();
    return (f[1] ? 1 : 0) + (f[2] ? 1 : 0) + (f[3] ? 1 : 0) + (f[4] ? 1 : 0);
  });

  constructor() {
    effect(() => {
      const event = this.builderState.stepEnforcement();
      if (event && event.stepId === 'brainstorm') {
        this.handleEnforcement();
      }
    });
  }

  ngOnInit(): void {
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
  onEscape(): void {
    if (this.isFocused()) {
      this.isFocused.set(false);
    }
  }

  private handleEnforcement(): void {
    if (!this.hasValidLogo()) {
      this.highlightErrorElement.set('logo');
      const logoEl = document.getElementById('logo-dropzone');
      logoEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const input = logoEl?.querySelector<HTMLInputElement>('input[type="file"]');
        input?.focus();
      }, 150);
      setTimeout(() => this.highlightErrorElement.set(null), 2500);
      return;
    }

    if (!this.isValidConcept()) {
      this.highlightErrorElement.set('desc');
      const descEl = document.getElementById('brainstorm-textarea');
      descEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => descEl?.focus(), 150);
      setTimeout(() => this.highlightErrorElement.set(null), 2500);
      return;
    }

    if (!this.builderState.brainstormAnalyzed()) {
      this.highlightErrorElement.set('initiate');
      const btn = document.getElementById('initiate-btn');
      btn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      btn?.focus();
      setTimeout(() => this.highlightErrorElement.set(null), 2500);
    }
  }

  applyStarterChip(chip: StarterChip): void {
    const translated = this.localeService.translate(chip.snippetKey);
    this.descriptionControl.setValue(translated);
    this.descriptionControl.markAsDirty();
  }

  openZenStudio(): void {
    this.isFocused.set(true);
  }

  closeZenStudio(): void {
    this.isFocused.set(false);
  }

  onZenDialogStateChanged(state: 'open' | 'closed'): void {
    this.isFocused.set(state === 'open');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
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

  removeLogo(): void {
    this.logoFile.set(null);
    this.logoPreview.set(null);
    this.builderState.hasLogo.set(false);
    this.builderState.logoUrl.set(null);
  }

  onNext(): void {
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
