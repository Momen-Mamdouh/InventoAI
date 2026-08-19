import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemeItem } from '@/app/features/builder/services/themes-api';
import {
  BuilderStepId,
  MIN_BRAINSTORM_LENGTH,
} from '@/app/features/builder/constants/builder-steps';
import { INTERVIEW_QUESTIONS } from '@/app/features/builder/constants/interview-questions';

export type AnswerValue = string | number | string[] | number[];

const STORAGE_KEY = 'invento.builder-state';

/**
 * Logos are held as base64 data URLs and may be up to 5MB, which would blow the
 * ~5MB sessionStorage quota on its own. Anything larger is simply not persisted:
 * the logo preview is lost on refresh, but the rest of the wizard survives.
 */
const MAX_PERSISTED_LOGO_BYTES = 512 * 1024;

/** Fields restored across a page refresh. */
interface PersistedState {
  brainstorm: string;
  hasLogo: boolean;
  logoUrl: string | null;
  aiAnswers: Record<string, AnswerValue>;
  selectedTheme: string;
  businessName: string;
  businessType: string;
  targetAudience: string;
  domain: string;
  domainConfirmed: boolean;
}

@Injectable({ providedIn: 'root' })
export class BuilderState {
  private readonly platformId = inject(PLATFORM_ID);

  readonly isNavigating = signal(false);

  /**
   * True only once Validation's Finish button has actually round-tripped to
   * the backend (domain confirmed + themes generated). The three text fields
   * it sits beside are pre-filled from Brainstorm and the AI interview, so
   * they cannot tell us whether that call ever happened.
   */
  readonly domainConfirmed = signal(false);
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

  readonly isBrainstormComplete = computed(
    () => this.brainstorm().trim().length >= MIN_BRAINSTORM_LENGTH,
  );

  /**
   * Only *required* questions gate progress. Checking every recorded answer
   * would block users who leave the optional colour question (q7) blank, since
   * the brainstorm step pre-fills a key for it either way.
   */
  readonly isAiInterviewComplete = computed(() => {
    const answers = this.aiAnswers();
    if (Object.keys(answers).length === 0) return false;

    return INTERVIEW_QUESTIONS.filter((q) => q.required).every((q) => {
      const value = answers[q.id];
      if (value === undefined || value === null) return false;
      return Array.isArray(value) ? value.length > 0 : String(value).trim() !== '';
    });
  });

  readonly isValidationComplete = computed(
    () =>
      this.businessName().trim() !== '' &&
      this.businessType().trim() !== '' &&
      this.targetAudience().trim() !== '' &&
      // Without this the step counted as done the moment the fields were
      // populated, so Preview was reachable without ever calling the backend.
      this.domainConfirmed(),
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

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.restore();

    // Persist on every change so a refresh mid-wizard doesn't drop the user's
    // work (and get bounced back to step 1 by the guards).
    effect(() => {
      const snapshot: PersistedState = {
        brainstorm: this.brainstorm(),
        hasLogo: this.hasLogo(),
        logoUrl: this.persistableLogo(),
        aiAnswers: this.aiAnswers(),
        selectedTheme: this.selectedTheme(),
        businessName: this.businessName(),
        businessType: this.businessType(),
        targetAudience: this.targetAudience(),
        domain: this.domain(),
        domainConfirmed: this.domainConfirmed(),
      };
      this.persist(snapshot);
    });
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
    this.domainConfirmed.set(false);
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* storage unavailable — nothing to clean up */
      }
    }
  }

  /** Returns the logo data URL only when it is small enough to store. */
  private persistableLogo(): string | null {
    const url = this.logoUrl();
    return url && url.length <= MAX_PERSISTED_LOGO_BYTES ? url : null;
  }

  private persist(snapshot: PersistedState): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Quota or private-mode failure. Persistence is a convenience, never a
      // requirement — the wizard still works entirely from memory.
    }
  }

  /** Reads the saved snapshot, treating unreadable or corrupt storage as "nothing saved". */
  private readSnapshot(): Partial<PersistedState> | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Partial<PersistedState>) : null;
    } catch {
      return null;
    }
  }

  private restore(): void {
    const saved = this.readSnapshot();
    if (!saved) return;

    if (typeof saved.brainstorm === 'string') this.brainstorm.set(saved.brainstorm);
    if (typeof saved.hasLogo === 'boolean') this.hasLogo.set(saved.hasLogo);
    if (typeof saved.logoUrl === 'string') this.logoUrl.set(saved.logoUrl);
    if (saved.aiAnswers && typeof saved.aiAnswers === 'object') this.aiAnswers.set(saved.aiAnswers);
    if (typeof saved.selectedTheme === 'string') this.selectedTheme.set(saved.selectedTheme);
    if (typeof saved.businessName === 'string') this.businessName.set(saved.businessName);
    if (typeof saved.businessType === 'string') this.businessType.set(saved.businessType);
    if (typeof saved.targetAudience === 'string') this.targetAudience.set(saved.targetAudience);
    if (typeof saved.domain === 'string') this.domain.set(saved.domain);
    if (typeof saved.domainConfirmed === 'boolean')
      this.domainConfirmed.set(saved.domainConfirmed);
  }
}
