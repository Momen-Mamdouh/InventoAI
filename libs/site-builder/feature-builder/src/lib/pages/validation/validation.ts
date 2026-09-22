import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import {
  lucideGlobe,
  lucideAlertTriangle,
  lucideLoader2,
  lucideSearch,
  lucideCheck,
  lucideCheckCircle2,
  lucideCircleAlert,
  lucideLock,
  lucideCopy,
  lucideSparkles,
  lucideRefreshCw,
  lucideStore,
  lucideLayers,
  lucideUsers,
  lucideArrowRight,
  lucideExternalLink,
  lucideShieldCheck,
} from '@ng-icons/lucide';

import { HlmLabel } from '@spartan/helm/label';
import { HlmInput } from '@spartan/helm/input';
import { HlmButton } from '@spartan/helm/button';
import {
  HlmCard,
  HlmCardContent,
  HlmCardDescription,
  HlmCardHeader,
  HlmCardTitle,
} from '@spartan/helm/card';
import { HlmAlertImports } from '@spartan/helm/alert';
import { HlmSpinner } from '@spartan/helm/spinner';
import { HlmH3, HlmMuted } from '@spartan/helm/typography';
import { PageHeader } from '@invento/shared-ui-page-header';
import { ActionButton } from '@invento/shared-ui-action-button';
import {
  BuilderState,
  DomainApi,
  ThemesApi,
  withMinDuration,
} from '@invento/site-builder-data-access-builder';
import { ApiConfig } from '@invento/site-builder-data-access-preview';
import { TranslatePipe, LocaleService } from '@invento/shared-util-i18n';
import { toast } from '@spartan/helm/sonner';
import {
  Subject,
  switchMap,
  tap,
  finalize,
  of,
  timer,
  map,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';
import { toastApiError } from '../../utils/toast-api-error';
import {
  BUSINESS_NAME_CHECKS,
  DOMAIN_SLUG_CHECKS,
  toDomainSlug,
  sanitizeDomainSlug,
  isReservedSlug,
  generateAlgorithmicSuggestions,
  calculateBrandMetrics,
} from '../../constants/business-name-rules';

type WorkflowStep = 'INPUT' | 'AI_ANALYSIS';

@Component({
  selector: 'app-validation',
  imports: [
    FormsModule,
    NgIconComponent,
    HlmLabel,
    HlmInput,
    HlmButton,
    HlmCard,
    HlmCardHeader,
    HlmCardTitle,
    HlmCardDescription,
    HlmCardContent,
    ...HlmAlertImports,
    HlmSpinner,
    HlmH3,
    HlmMuted,
    PageHeader,
    ActionButton,
    TranslatePipe,
  ],
  providers: [
    provideIcons({
      lucideGlobe,
      lucideAlertTriangle,
      lucideLoader2,
      lucideSearch,
      lucideCheck,
      lucideCheckCircle2,
      lucideCircleAlert,
      lucideLock,
      lucideCopy,
      lucideSparkles,
      lucideRefreshCw,
      lucideStore,
      lucideLayers,
      lucideUsers,
      lucideArrowRight,
      lucideExternalLink,
      lucideShieldCheck,
    }),
  ],
  templateUrl: './validation.html',
  styleUrl: './validation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Validation {
  private readonly _localeService = inject(LocaleService);
  private readonly builderState = inject(BuilderState);
  private readonly domainApi = inject(DomainApi);
  private readonly themesApi = inject(ThemesApi);
  private readonly apiConfig = inject(ApiConfig);
  private readonly router = inject(Router);

  readonly businessName = this.builderState.businessName;
  readonly businessType = this.builderState.businessType;
  readonly targetAudience = this.builderState.targetAudience;
  readonly domain = this.builderState.domain;

  readonly isProduction = computed(() => this.apiConfig.isProduction);
  readonly storeBaseUrl = computed(() => this.apiConfig.storeBaseUrl);
  readonly storeBaseProtocol = computed(() =>
    this.storeBaseUrl().startsWith('https://') ? 'https://' : 'http://',
  );
  readonly storeBaseHost = computed(() =>
    this.storeBaseUrl().replace(/^https?:\/\//, '').replace(/\/+$/, ''),
  );
  readonly fullStoreUrl = computed(() => {
    const slug = this.domain().trim() || 'store';
    const base = this.storeBaseUrl();
    if (base.includes('{slug}')) {
      return base.replace('{slug}', slug);
    }
    return `${base}/${slug}`;
  });

  readonly isSubmitting = signal(false);
  readonly currentStep = signal<WorkflowStep>('INPUT');
  readonly analysisStep = signal<1 | 2 | 3>(1);
  readonly highlightErrorElement = signal<'name' | 'domain' | 'btn' | null>(null);

  /** Domain availability status */
  readonly domainAvailability = signal<
    'idle' | 'checking' | 'available' | 'unavailable' | 'invalid'
  >('idle');
  readonly availabilityReason = signal<string | null>(null);
  readonly selectedSuggestion = signal<string | null>(null);
  readonly proactiveSuggestions = signal<string[]>([]);
  readonly domainSuggestions = signal<string[]>([]);
  readonly hintMessage = signal<string | null>(null);
  readonly urlCopied = signal<boolean>(false);

  /** Once the user edits the domain themselves we stop deriving it from the name. */
  readonly domainTouched = signal(false);

  private readonly domainCheck$ = new Subject<string>();

  readonly storeLogo = computed(() => this.builderState.logoUrl());
  readonly hasLogo = computed(() => this.builderState.hasLogo());

  readonly brandMetrics = computed(() =>
    calculateBrandMetrics(this.businessName()),
  );

  readonly nameChecks = computed(() => {
    const name = this.businessName().trim();
    return BUSINESS_NAME_CHECKS.map((check) => ({
      id: check.id,
      label: check.labelKey,
      passed: check.passes(name),
    }));
  });

  readonly domainChecks = computed(() => {
    const slug = this.domain().trim();
    return DOMAIN_SLUG_CHECKS.map((check) => ({
      id: check.id,
      label: check.labelKey,
      passed: check.passes(slug),
    }));
  });

  readonly allNameChecksPassed = computed(() =>
    this.nameChecks().every((check) => check.passed),
  );
  readonly allDomainChecksPassed = computed(() =>
    this.domainChecks().every((check) => check.passed),
  );
  readonly allChecksPassed = computed(
    () => this.allNameChecksPassed() && this.allDomainChecksPassed(),
  );
  readonly checksPassedCount = computed(
    () =>
      this.nameChecks().filter((c) => c.passed).length +
      this.domainChecks().filter((c) => c.passed).length,
  );

  readonly canSubmit = computed(
    () =>
      !!this.businessName().trim() &&
      !!this.domain().trim() &&
      this.builderState.hasValidationInputs() &&
      this.allChecksPassed() &&
      this.domainAvailability() !== 'unavailable' &&
      this.domainAvailability() !== 'checking' &&
      !this.isSubmitting(),
  );

  constructor() {
    this.seedFromInterview();

    this.domainCheck$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((slug) => {
          const trimmed = slug.trim();
          if (!trimmed || trimmed.length < 3 || !this.allDomainChecksPassed()) {
            this.domainAvailability.set('invalid');
            this.availabilityReason.set(null);
            return of(null);
          }
          if (isReservedSlug(trimmed)) {
            this.domainAvailability.set('unavailable');
            this.availabilityReason.set('reserved');
            this.domainSuggestions.set(
              generateAlgorithmicSuggestions(this.businessName()),
            );
            return of(null);
          }
          this.domainAvailability.set('checking');
          return timer(200).pipe(
            map(() => ({ available: true, slug: trimmed })),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((res) => {
        if (!res) return;
        this.domainAvailability.set('available');
        this.availabilityReason.set(null);
      });

    if (this.domain().trim()) {
      this.domainCheck$.next(this.domain().trim());
    }

    effect(() => {
      const event = this.builderState.stepEnforcement();
      if (event && event.stepId === 'validation') {
        this.handleEnforcement();
      }
    });
  }

  private handleEnforcement(): void {
    if (!this.businessName().trim() || !this.allNameChecksPassed()) {
      this.highlightErrorElement.set('name');
      const el = document.getElementById('bizName');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el?.focus(), 150);
      setTimeout(() => this.highlightErrorElement.set(null), 2500);
      return;
    }

    if (!this.domain().trim() || !this.allDomainChecksPassed()) {
      this.highlightErrorElement.set('domain');
      const el = document.getElementById('bizDomain');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el?.focus(), 150);
      setTimeout(() => this.highlightErrorElement.set(null), 2500);
      return;
    }

    if (!this.builderState.domainConfirmed()) {
      this.highlightErrorElement.set('btn');
      const btn = document.getElementById('validation-submit-btn');
      btn?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => btn?.focus(), 150);
      setTimeout(() => this.highlightErrorElement.set(null), 2500);
    }
  }

  private seedFromInterview(): void {
    const answers = this.builderState.aiAnswers();
    const answerText = (id: string): string => {
      const value = answers[id];
      if (value === undefined || value === null) return '';
      return Array.isArray(value) ? value.join(', ') : String(value).trim();
    };

    if (!this.businessName()) {
      this.builderState.businessName.set(answerText('q1'));
    }
    if (!this.businessType()) {
      this.builderState.businessType.set(answerText('q2'));
    }
    if (!this.targetAudience()) {
      this.builderState.targetAudience.set(answerText('q3'));
    }
    if (!this.domain()) {
      this.builderState.domain.set(toDomainSlug(this.businessName()));
    }
  }

  onBusinessNameChange(value: string): void {
    this.builderState.businessName.set(value);
    if (!this.domainTouched()) {
      const derived = toDomainSlug(value);
      this.builderState.domain.set(derived);
      this.selectedSuggestion.set(null);
      this.domainCheck$.next(derived);
    }
  }

  onBusinessTypeChange(value: string): void {
    this.builderState.businessType.set(value);
  }

  onTargetAudienceChange(value: string): void {
    this.builderState.targetAudience.set(value);
  }

  onDomainChange(value: string): void {
    const sanitized = sanitizeDomainSlug(value);
    this.domainTouched.set(true);
    this.builderState.domain.set(sanitized);
    this.selectedSuggestion.set(null);
    if (!sanitized || sanitized.length < 3) {
      this.domainAvailability.set('invalid');
      return;
    }
    this.domainCheck$.next(sanitized);
  }

  applySuggestion(suggestion: string): void {
    const sanitized = sanitizeDomainSlug(suggestion);
    this.domainTouched.set(true);
    this.builderState.domain.set(sanitized);
    this.selectedSuggestion.set(sanitized);
    this.domainSuggestions.set([]);
    this.proactiveSuggestions.set([]);
    this.domainAvailability.set('available');
    this.domainCheck$.next(sanitized);
  }

  exploreSuggestions(): void {
    const list = generateAlgorithmicSuggestions(this.businessName());
    this.proactiveSuggestions.set(list);
  }

  syncDomainWithName(): void {
    const derived = toDomainSlug(this.businessName());
    this.domainTouched.set(false);
    this.builderState.domain.set(derived);
    this.selectedSuggestion.set(null);
    if (derived) {
      this.domainCheck$.next(derived);
    }
  }

  copyStoreUrl(): void {
    const url = this.fullStoreUrl();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.urlCopied.set(true);
        setTimeout(() => this.urlCopied.set(false), 2000);
      });
    }
  }

  finish(): void {
    if (this.isSubmitting()) return;

    const nameUnchanged = this.businessName().trim() === this.builderState.businessName().trim();
    const domainUnchanged = this.domain().trim() === this.builderState.domain().trim();
    if (
      this.builderState.domainConfirmed() &&
      this.builderState.themes().length > 0 &&
      nameUnchanged &&
      domainUnchanged
    ) {
      toast.info(this._localeService.translate('validation_resumed_notice'));
      this.router.navigate(['/build/preview']);
      return;
    }

    this.isSubmitting.set(true);
    this.builderState.domainConfirmed.set(false);
    this.builderState.isNavigating.set(true);
    this.currentStep.set('AI_ANALYSIS');
    this.analysisStep.set(1);
    this.domainSuggestions.set([]);
    this.hintMessage.set(null);

    const pipeline$ = this.domainApi
      .confirmDomain({
        businessName: this.businessName(),
        domain: this.domain(),
      })
      .pipe(
        tap((res) => {
          this.analysisStep.set(2);
          if (res.hint) {
            this.hintMessage.set(res.hint);
            toast.warning(res.hint);
          }
        }),
        switchMap(() => {
          this.analysisStep.set(3);
          return this.themesApi.generateThemes();
        }),
        switchMap((themesRes) =>
          themesRes?.themes?.length ? of(themesRes) : this.themesApi.getThemes(),
        ),
        finalize(() => this.isSubmitting.set(false)),
      );

    withMinDuration(pipeline$, 900).subscribe({
      next: (themesRes) => {
        if (themesRes?.themes?.length) {
          this.builderState.themes.set(themesRes.themes);
        }
        this.builderState.domainConfirmed.set(true);
        this.router.navigate(['/build/preview']);
        toast.success(
          this._localeService.translate('validation_domain_confirmed'),
        );
      },
      error: (err) => {
        this.builderState.isNavigating.set(false);
        this.currentStep.set('INPUT');
        this.domainAvailability.set('unavailable');
        if (err?.error?.suggestions) {
          this.domainSuggestions.set(err.error.suggestions);
        } else {
          this.domainSuggestions.set(
            generateAlgorithmicSuggestions(this.businessName()),
          );
        }
        toastApiError(err, 'validation_domain_failed', this._localeService);
      },
    });
  }
}

