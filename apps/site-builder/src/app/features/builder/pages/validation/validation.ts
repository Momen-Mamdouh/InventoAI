import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import { lucideGlobe, lucideAlertTriangle, lucideLoader2, lucideSearch } from '@ng-icons/lucide';

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
import { PageHeader } from '@/app/shared/components/page-header/page-header';
import { DoubleSlash } from '@invento/shared';
import { BuilderState } from '@/app/features/builder/services/builder-state';
import { TranslatePipe, LocaleService } from '@invento/core';
import { toast } from '@spartan/helm/sonner';
import { switchMap, tap, finalize } from 'rxjs';
import { DomainApi } from '@/app/features/builder/services/domain-api';
import { ThemesApi } from '@/app/features/builder/services/themes-api';
import { toastApiError } from '@/app/shared/utils/toast-api-error';
import {
  BUSINESS_NAME_CHECKS,
  toDomainSlug,
} from '@/app/features/builder/constants/business-name-rules';

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
    PageHeader,
    DoubleSlash,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucideGlobe, lucideAlertTriangle, lucideLoader2, lucideSearch })],
  templateUrl: './validation.html',
  styleUrl: './validation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Validation {
  private readonly _localeService = inject(LocaleService);
  private readonly builderState = inject(BuilderState);
  private readonly domainApi = inject(DomainApi);
  private readonly themesApi = inject(ThemesApi);
  private readonly router = inject(Router);

  readonly businessName = this.builderState.businessName;
  readonly businessType = this.builderState.businessType;
  readonly targetAudience = this.builderState.targetAudience;
  readonly domain = this.builderState.domain;

  readonly isSubmitting = signal(false);
  readonly currentStep = signal<WorkflowStep>('INPUT');

  /** Once the user edits the domain themselves we stop deriving it from the name. */
  private readonly domainTouched = signal(false);

  readonly liveChecks = computed(() => {
    const name = this.businessName().trim();
    return BUSINESS_NAME_CHECKS.map((check) => ({
      id: check.id,
      label: check.labelKey,
      passed: check.passes(name),
    }));
  });

  readonly isFormatValid = computed(() => this.liveChecks().every((check) => check.passed));

  readonly canSubmit = computed(
    () =>
      !!this.businessName() &&
      !!this.domain() &&
      this.builderState.isValidationComplete() &&
      this.isFormatValid() &&
      !this.isSubmitting(),
  );

  constructor() {
    this.seedFromInterview();
  }

  /**
   * The interview already asks what the business sells (q2) and who it targets
   * (q3), so pre-fill this step from those answers instead of making the user
   * retype them. Without this the fields start blank, and since they gate
   * isValidationComplete the user would be bounced straight back here from
   * Preview.
   */
  private seedFromInterview(): void {
    const answers = this.builderState.aiAnswers();
    const answerText = (id: string): string => {
      const value = answers[id];
      if (value === undefined || value === null) return '';
      return Array.isArray(value) ? value.join(', ') : String(value).trim();
    };

    if (!this.businessName()) this.builderState.businessName.set(answerText('q1'));
    if (!this.businessType()) this.builderState.businessType.set(answerText('q2'));
    if (!this.targetAudience()) this.builderState.targetAudience.set(answerText('q3'));
    if (!this.domain()) this.builderState.domain.set(toDomainSlug(this.businessName()));
  }

  onBusinessNameChange(value: string): void {
    this.builderState.businessName.set(value);
    if (!this.domainTouched()) {
      this.builderState.domain.set(toDomainSlug(value));
    }
  }

  onBusinessTypeChange(value: string): void {
    this.builderState.businessType.set(value);
  }

  onTargetAudienceChange(value: string): void {
    this.builderState.targetAudience.set(value);
  }

  onDomainChange(value: string): void {
    this.domainTouched.set(true);
    this.builderState.domain.set(value);
  }

  readonly domainSuggestions = signal<string[]>([]);
  readonly hintMessage = signal<string | null>(null);

  finish(): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    // Cleared up front so a failed or abandoned retry cannot leave a stale
    // confirmation behind that would keep the Preview guard open.
    this.builderState.domainConfirmed.set(false);
    this.builderState.isNavigating.set(true);
    this.currentStep.set('AI_ANALYSIS');
    this.domainSuggestions.set([]);
    this.hintMessage.set(null);

    this.domainApi
      .confirmDomain({ businessName: this.businessName(), domain: this.domain() })
      .pipe(
        tap((res) => {
          if (res?.isFallback) {
            toast.warning(this._localeService.translate('toast_domain_fallback'));
          } else {
            if (res.hint) {
              this.hintMessage.set(res.hint);
              toast.warning(res.hint);
            } else {
              toast.success(this._localeService.translate('validation_domain_confirmed'));
            }
          }
        }),
        // Theme generation is best-effort: both calls already degrade to an
        // empty result rather than throwing, so Preview is always reachable
        // once the domain is confirmed.
        switchMap(() => this.themesApi.generateThemes()),
        switchMap(() => this.themesApi.getThemes()),
        // isNavigating is deliberately NOT cleared here. Clearing it on
        // completion tore the loader down at the same instant we navigated, so
        // Preview mounted bare and the shopper saw its skeleton instead of the
        // loader. Preview now clears it once it actually has themes to show;
        // the error path below clears it for the case where we never navigate.
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (themesRes) => {
          if (themesRes?.themes?.length) {
            this.builderState.themes.set(themesRes.themes);
          }
          // Only now is the step genuinely complete: the domain was confirmed
          // and theme generation ran. This is what opens the Preview guard.
          this.builderState.domainConfirmed.set(true);
          this.router.navigate(['/build/preview']);
        },
        error: (err) => {
          this.builderState.isNavigating.set(false);
          this.currentStep.set('INPUT');
          if (err?.error?.suggestions) {
            this.domainSuggestions.set(err.error.suggestions);
          }
          toastApiError(err, 'validation_domain_failed', this._localeService);
        },
      });
  }
}
