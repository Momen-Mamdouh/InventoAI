// restock-advisor.service.ts (AI Advisor Service)
import { DestroyRef, Injectable, computed, inject, resource, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { AUTH_CONFIG } from '@invento/shared-data-access-auth';
import {
  Insight,
  InsightStatus,
  TodaysBriefResponse,
  UpdateInsightStatusRequest,
  Brief,
  BriefSummary,
  ListBriefsResponse,
  ListBriefsParams,
  AdvisorSettings,
  UpdateAdvisorSettingsRequest,
} from './ai-advisor.types';

export type AdvisorFilter = 'all' | 'restock' | 'overstock' | 'insights' | 'dismissed';
export type RecommendationFilter = AdvisorFilter;

@Injectable({ providedIn: 'root' })
export class AiAdvisorService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(AUTH_CONFIG).apiBaseUrl}/advisor`;
  private readonly destroyRef = inject(DestroyRef);

  // --- Today's Brief State ---
  readonly filter = signal<AdvisorFilter>('all');
  private readonly reloadTrigger = signal<number>(0);
  private readonly statusOverrides = signal<Record<string, InsightStatus>>({});

  // --- Endpoint E: Per-insight in-flight tracking & server-updated insight map ---
  readonly updatingInsightIds = signal<Record<string, boolean>>({});
  private readonly updatedInsightsMap = signal<Record<string, Insight>>({});

  // --- Endpoint D (Manual Generation / Cooldown State) ---
  readonly isGenerating = signal<boolean>(false);
  readonly cooldownSeconds = signal<number>(0);
  readonly hasManualGenerated = signal<boolean>(false);
  private readonly manualResponse = signal<TodaysBriefResponse | null>(null);
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  // --- History / Past Briefs State (Endpoint B) ---
  readonly historyPage = signal<number>(1);
  readonly historyLimit = signal<number>(20);
  readonly historyFrom = signal<string>('');
  readonly historyTo = signal<string>('');
  private readonly historyReloadTrigger = signal<number>(0);

  // --- Single Brief Detail State (Endpoint C) ---
  readonly selectedBriefId = signal<string | null>(null);
  private readonly selectedBriefReloadTrigger = signal<number>(0);

  // --- Endpoint F (Advisor Settings State) ---
  private readonly settingsReloadTrigger = signal<number>(0);
  private readonly manualSettings = signal<AdvisorSettings | null>(null);
  readonly savingSections = signal<Record<string, boolean>>({});

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearCooldown();
    });
  }

  /**
   * Endpoint A: Fetches today's brief from GET /advisor/brief
   */
  getTodaysBrief(): Observable<TodaysBriefResponse> {
    return this.http.get<TodaysBriefResponse>(`${this.apiUrl}/brief`);
  }

  /**
   * Endpoint D: Manually generates/regenerates today's brief from POST /advisor/generate
   */
  generateBrief(): Observable<TodaysBriefResponse> {
    return this.http.post<TodaysBriefResponse>(`${this.apiUrl}/generate`, {});
  }

  /**
   * Endpoint B: Fetches briefs history from GET /advisor/briefs
   */
  listBriefs(params?: ListBriefsParams): Observable<ListBriefsResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page !== undefined && params.page !== null) {
        httpParams = httpParams.set('page', params.page.toString());
      }
      if (params.limit !== undefined && params.limit !== null) {
        httpParams = httpParams.set('limit', params.limit.toString());
      }
      if (params.from) {
        httpParams = httpParams.set('from', params.from);
      }
      if (params.to) {
        httpParams = httpParams.set('to', params.to);
      }
    }
    return this.http.get<ListBriefsResponse>(`${this.apiUrl}/briefs`, { params: httpParams });
  }

  /**
   * Endpoint C: Fetches a single past brief by ID from GET /advisor/briefs/{id}
   */
  getBriefById(id: string): Observable<Brief> {
    return this.http.get<Brief>(`${this.apiUrl}/briefs/${id}`);
  }

  /**
   * Endpoint E: Updates an insight's status via PATCH /advisor/insights/{id}
   */
  updateInsightStatus(id: string, status: 'acted' | 'dismissed'): Observable<Insight> {
    const payload: UpdateInsightStatusRequest = { status };
    return this.http.patch<Insight>(`${this.apiUrl}/insights/${id}`, payload);
  }

  /**
   * Endpoint F: Fetches advisor configuration from GET /advisor/settings
   */
  getSettings(): Observable<AdvisorSettings> {
    return this.http.get<AdvisorSettings>(`${this.apiUrl}/settings`);
  }

  /**
   * Endpoint F: Updates advisor configuration via PATCH /advisor/settings
   */
  updateAdvisorSettings(payload: UpdateAdvisorSettingsRequest): Observable<AdvisorSettings> {
    return this.http.patch<AdvisorSettings>(`${this.apiUrl}/settings`, payload);
  }

  // --- Signal Resources for OnPush change detection ---

  readonly briefResource = resource<TodaysBriefResponse | null, { reload: number }>({
    params: () => ({ reload: this.reloadTrigger() }),
    loader: async () => {
      return await firstValueFrom(this.getTodaysBrief());
    },
  });

  readonly historyResource = resource<
    ListBriefsResponse | null,
    { page: number; limit: number; from: string; to: string; reload: number }
  >({
    params: () => ({
      page: this.historyPage(),
      limit: this.historyLimit(),
      from: this.historyFrom(),
      to: this.historyTo(),
      reload: this.historyReloadTrigger(),
    }),
    loader: async ({ params }) => {
      return await firstValueFrom(
        this.listBriefs({
          page: params.page,
          limit: params.limit,
          from: params.from || undefined,
          to: params.to || undefined,
        }),
      );
    },
  });

  readonly selectedBriefResource = resource<Brief | null, { id: string | null; reload: number }>({
    params: () => ({
      id: this.selectedBriefId(),
      reload: this.selectedBriefReloadTrigger(),
    }),
    loader: async ({ params }) => {
      if (!params.id) return null;
      return await firstValueFrom(this.getBriefById(params.id));
    },
  });

  readonly settingsResource = resource<AdvisorSettings | null, { reload: number }>({
    params: () => ({
      reload: this.settingsReloadTrigger(),
    }),
    loader: async () => {
      return await firstValueFrom(this.getSettings());
    },
  });

  // --- Today's Brief Computed Signals ---

  readonly isLoading = computed(() => this.briefResource.isLoading());
  readonly error = computed(() => this.briefResource.error() as HttpErrorResponse | Error | null);

  readonly isForbidden = computed(() => {
    const err = this.error();
    return err instanceof HttpErrorResponse ? err.status === 403 : false;
  });

  readonly isUnauthorized = computed(() => {
    const err = this.error();
    return err instanceof HttpErrorResponse ? err.status === 401 : false;
  });

  readonly response = computed(() => this.manualResponse() ?? this.briefResource.value() ?? null);
  readonly brief = computed<Brief | null>(() => this.response()?.brief ?? null);
  readonly isStale = computed(() => this.response()?.isStale ?? false);
  readonly headline = computed(() => this.brief()?.headline ?? '');

  /**
   * All insights in pre-sorted position order with optimistic overrides and server-updated insights applied.
   * Rule #3: Insights arrive pre-sorted by position — never sort by anything else.
   */
  readonly allInsights = computed<Insight[]>(() => {
    const currentBrief = this.brief();
    if (!currentBrief?.insights) return [];

    const updatedMap = this.updatedInsightsMap();
    const overrides = this.statusOverrides();

    return currentBrief.insights.map((insight) => {
      if (updatedMap[insight.id]) {
        return updatedMap[insight.id];
      }
      if (overrides[insight.id]) {
        return {
          ...insight,
          status: overrides[insight.id],
        };
      }
      return insight;
    });
  });

  /**
   * Filtered insights according to active filter pill, maintaining position order.
   */
  readonly data = computed<Insight[]>(() => {
    const insights = this.allInsights();
    const currentFilter = this.filter();

    switch (currentFilter) {
      case 'restock':
        return insights.filter((i) => i.kind === 'restock' || i.kind === 'stockout');
      case 'overstock':
        return insights.filter((i) => i.kind === 'slow_mover');
      case 'insights':
        return insights.filter(
          (i) =>
            i.kind === 'trending' ||
            i.kind === 'demand_gap' ||
            i.kind === 'seasonal_event' ||
            i.kind === 'weather',
        );
      case 'dismissed':
        return insights.filter((i) => i.status === 'dismissed');
      case 'all':
      default:
        return insights;
    }
  });

  readonly count = computed(() => this.data().length);
  readonly recommendations = this.briefResource;

  // --- History Computed Signals (Endpoint B) ---

  readonly isHistoryLoading = computed(() => this.historyResource.isLoading());
  readonly historyError = computed(
    () => this.historyResource.error() as HttpErrorResponse | Error | null,
  );
  readonly isHistoryForbidden = computed(() => {
    const err = this.historyError();
    return err instanceof HttpErrorResponse ? err.status === 403 : false;
  });

  readonly historyValidationErrors = computed<string[]>(() => {
    const err = this.historyError();
    if (err instanceof HttpErrorResponse && err.status === 400) {
      const msg = err.error?.message;
      if (Array.isArray(msg)) return msg;
      if (typeof msg === 'string') return [msg];
      return ['Invalid query parameters. Please check your date range.'];
    }
    return [];
  });

  readonly historyResponse = computed(() => this.historyResource.value() ?? null);
  readonly historyItems = computed<BriefSummary[]>(() => this.historyResponse()?.items ?? []);
  readonly historyTotal = computed(() => this.historyResponse()?.total ?? 0);
  readonly historyTotalPages = computed(() => this.historyResponse()?.totalPages ?? 1);

  // --- Single Brief Detail Computed Signals (Endpoint C) ---

  readonly isSelectedBriefLoading = computed(() => this.selectedBriefResource.isLoading());
  readonly selectedBriefError = computed(
    () => this.selectedBriefResource.error() as HttpErrorResponse | Error | null,
  );
  readonly isSelectedBriefNotFound = computed(() => {
    const err = this.selectedBriefError();
    return err instanceof HttpErrorResponse ? err.status === 404 : false;
  });
  readonly isSelectedBriefForbidden = computed(() => {
    const err = this.selectedBriefError();
    return err instanceof HttpErrorResponse ? err.status === 403 : false;
  });

  readonly rawSelectedBrief = computed<Brief | null>(
    () => this.selectedBriefResource.value() ?? null,
  );

  /**
   * Historical brief with optimistic overrides and server-updated insights applied.
   */
  readonly selectedBrief = computed<Brief | null>(() => {
    const b = this.rawSelectedBrief();
    if (!b?.insights) return b;
    const updatedMap = this.updatedInsightsMap();
    const overrides = this.statusOverrides();

    return {
      ...b,
      insights: b.insights.map((insight) => {
        if (updatedMap[insight.id]) {
          return updatedMap[insight.id];
        }
        if (overrides[insight.id]) {
          return {
            ...insight,
            status: overrides[insight.id],
          };
        }
        return insight;
      }),
    };
  });

  // --- Settings Computed Signals (Endpoint F) ---

  readonly isSettingsLoading = computed(() => this.settingsResource.isLoading());
  readonly settingsError = computed(
    () => this.settingsResource.error() as HttpErrorResponse | Error | null,
  );
  readonly isSettingsForbidden = computed(() => {
    const err = this.settingsError();
    return err instanceof HttpErrorResponse ? err.status === 403 : false;
  });
  readonly settings = computed<AdvisorSettings | null>(
    () => this.manualSettings() ?? this.settingsResource.value() ?? null,
  );

  isSectionSaving(sectionKey: string): boolean {
    return Boolean(this.savingSections()[sectionKey]);
  }

  // --- Actions ---

  setFilter(filter: AdvisorFilter) {
    this.filter.set(filter);
  }

  reload() {
    this.manualResponse.set(null);
    this.statusOverrides.set({});
    this.updatedInsightsMap.set({});
    this.reloadTrigger.update((n) => n + 1);
  }

  /**
   * Endpoint D: Triggers manual generation with in-flight locking, 429 countdown, and immediate panel state swap.
   */
  async generateNow(): Promise<TodaysBriefResponse> {
    if (this.isGenerating() || this.cooldownSeconds() > 0) {
      throw new Error('Generation already in progress or in cooldown');
    }

    this.isGenerating.set(true);

    try {
      const res = await firstValueFrom(this.generateBrief());
      // Swap panel's entire state immediately from this response (Rule in §6)
      this.manualResponse.set(res);
      this.hasManualGenerated.set(true);
      // Trust statuses from response as-is, reset local overrides & updated map
      this.statusOverrides.set({});
      this.updatedInsightsMap.set({});
      this.clearCooldown();
      this.isGenerating.set(false);
      // Invalidate history so today's new/updated brief is reflected in the history list
      this.reloadHistory();
      return res;
    } catch (err) {
      this.isGenerating.set(false);

      if (err instanceof HttpErrorResponse && err.status === 429) {
        // Parse the remaining cooldown seconds defensively (e.g. "please wait 243 seconds")
        const msg = typeof err.error?.message === 'string' ? err.error.message : '';
        const match = msg.match(/(\d+)/);
        const seconds = match ? parseInt(match[1], 10) : 300;
        this.startCooldown(seconds);
      }
      throw err;
    }
  }

  private startCooldown(seconds: number) {
    this.clearCooldown();
    this.cooldownSeconds.set(Math.max(1, seconds));
    this.cooldownTimer = setInterval(() => {
      const current = this.cooldownSeconds();
      if (current <= 1) {
        this.clearCooldown();
      } else {
        this.cooldownSeconds.set(current - 1);
      }
    }, 1000);
  }

  private clearCooldown() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
    this.cooldownSeconds.set(0);
  }

  setHistoryPage(page: number) {
    this.historyPage.set(Math.max(1, page));
  }

  setHistoryDateRange(from: string, to: string) {
    this.historyFrom.set(from);
    this.historyTo.set(to);
    this.historyPage.set(1);
  }

  resetHistoryFilters() {
    this.historyFrom.set('');
    this.historyTo.set('');
    this.historyPage.set(1);
  }

  reloadHistory() {
    this.historyReloadTrigger.update((n) => n + 1);
  }

  selectBrief(id: string | null) {
    this.selectedBriefId.set(id);
  }

  reloadSelectedBrief() {
    this.selectedBriefReloadTrigger.update((n) => n + 1);
  }

  reloadSettings() {
    this.manualSettings.set(null);
    this.settingsReloadTrigger.update((n) => n + 1);
  }

  /**
   * Endpoint F: Updates advisor configuration via PATCH /advisor/settings.
   * Merges server-authoritative response directly into local state.
   */
  async patchSettings(
    sectionKey: string,
    payload: UpdateAdvisorSettingsRequest,
  ): Promise<AdvisorSettings> {
    this.savingSections.update((prev) => ({ ...prev, [sectionKey]: true }));

    try {
      const res = await firstValueFrom(this.updateAdvisorSettings(payload));
      this.manualSettings.set(res);
      return res;
    } finally {
      this.savingSections.update((prev) => {
        const next = { ...prev };
        delete next[sectionKey];
        return next;
      });
    }
  }

  /**
   * Endpoint E: Optimistically updates status and executes PATCH /advisor/insights/{id}.
   * On 200, immutably stores the returned Insight object to update today's panel or open history view.
   */
  async markInsight(insightId: string, status: 'acted' | 'dismissed'): Promise<Insight> {
    // 1. Mark in-flight for this specific insight
    this.updatingInsightIds.update((prev) => ({ ...prev, [insightId]: true }));
    // 2. Optimistic UI update
    this.statusOverrides.update((prev) => ({
      ...prev,
      [insightId]: status,
    }));

    try {
      const updated = await firstValueFrom(this.updateInsightStatus(insightId, status));
      // 3. Immutably store server-returned updated insight
      this.updatedInsightsMap.update((prev) => ({
        ...prev,
        [insightId]: updated,
      }));
      return updated;
    } catch (error) {
      // Revert optimistic update on failure
      this.statusOverrides.update((prev) => {
        const next = { ...prev };
        delete next[insightId];
        return next;
      });
      throw error;
    } finally {
      // Clear in-flight state for this insight
      this.updatingInsightIds.update((prev) => {
        const next = { ...prev };
        delete next[insightId];
        return next;
      });
    }
  }
}

// Backwards compatibility alias
export const RestockAdvisorService = AiAdvisorService;
export type RestockAdvisorService = AiAdvisorService;
