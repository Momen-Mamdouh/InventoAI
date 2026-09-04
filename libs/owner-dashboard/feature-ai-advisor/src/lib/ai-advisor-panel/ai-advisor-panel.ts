// ai-advisor-panel.ts
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmSheetImports } from '@spartan/helm/sheet';
import { HlmTabsImports } from '@spartan/helm/tabs';
import { HlmBadgeImports } from '@spartan/helm/badge';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmSpinner } from '@spartan/helm/spinner';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideSparkles,
  lucideExternalLink,
  lucideMail,
  lucideArrowRight,
  lucideArrowLeft,
  lucideAlertCircle,
  lucideAlertTriangle,
  lucideTrendingUp,
  lucidePackage,
  lucidePackageX,
  lucideClock,
  lucideHelpCircle,
  lucideCalendar,
  lucideCloudSun,
  lucideCheck,
  lucideShieldAlert,
  lucideRefreshCw,
  lucideTag,
  lucideRotateCcw,
  lucideHistory,
  lucideChevronLeft,
  lucideChevronRight,
  lucideCalendarRange,
  lucideFilterX,
  lucideInbox,
  lucideSend,
  lucideFileQuestion,
  lucidePlay,
  lucideLoader2,
  lucideSettings,
  lucideGlobe,
  lucideMapPin,
  lucideSliders,
  lucideInfo,
  lucideTrash2,
  lucideSave,
  lucideEdit3,
  lucideX,
} from '@ng-icons/lucide';
import { toast } from '@spartan/helm/sonner';
import { HlmH1, HlmH3, HlmH4, HlmMuted, HlmSmall } from '@spartan/helm/typography';
import { HlmTooltipImports } from '@spartan/helm/tooltip';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { Pagination } from '@invento/shared-ui-pagination';
import { EmptyState } from '@invento/shared-ui-empty-state';
import {
  Insight,
  InsightKind,
  InsightPayload,
  InsightSeverity,
  StockoutPayload,
  RestockPayload,
  TrendingPayload,
  SlowMoverPayload,
  DemandGapPayload,
  SeasonalEventPayload,
  WeatherPayload,
} from '../ai-advisor.types';
import { AiAdvisorService, AdvisorFilter } from '../restock-advisor.service';

export type AdvisorPanelTab = 'today' | 'history' | 'settings';

@Component({
  selector: 'app-ai-advisor-panel',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    HlmButtonImports,
    HlmSheetImports,
    HlmTabsImports,
    HlmBadgeImports,
    HlmCardImports,
    HlmInputImports,
    HlmLabelImports,
    HlmSpinner,
    HlmSkeleton,
    NgIcon,
    HlmH1,
    HlmH3,
    HlmH4,
    HlmMuted,
    HlmSmall,
    HlmTooltipImports,
    TranslatePipe,
    Pagination,
    EmptyState,
  ],
  providers: [
    provideIcons({
      lucideSparkles,
      lucideExternalLink,
      lucideMail,
      lucideArrowRight,
      lucideArrowLeft,
      lucideAlertCircle,
      lucideAlertTriangle,
      lucideTrendingUp,
      lucidePackage,
      lucidePackageX,
      lucideClock,
      lucideHelpCircle,
      lucideCalendar,
      lucideCloudSun,
      lucideCheck,
      lucideShieldAlert,
      lucideRefreshCw,
      lucideTag,
      lucideRotateCcw,
      lucideHistory,
      lucideChevronLeft,
      lucideChevronRight,
      lucideCalendarRange,
      lucideFilterX,
      lucideInbox,
      lucideSend,
      lucideFileQuestion,
      lucidePlay,
      lucideLoader2,
      lucideSettings,
      lucideGlobe,
      lucideMapPin,
      lucideSliders,
      lucideInfo,
      lucideTrash2,
      lucideSave,
      lucideEdit3,
      lucideX,
    }),
  ],
  templateUrl: './ai-advisor-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAdvisorPanel {
  private readonly advisorService = inject(AiAdvisorService);

  readonly asSheet = input<boolean>(false);
  readonly activeView = signal<AdvisorPanelTab>('today');

  // --- Today's Brief Signals (Endpoint A) ---
  readonly briefResource = this.advisorService.briefResource;
  readonly brief = this.advisorService.brief;
  readonly isStale = this.advisorService.isStale;
  readonly headline = this.advisorService.headline;
  readonly data = this.advisorService.data;
  readonly count = this.advisorService.count;
  readonly activeFilter = this.advisorService.filter;
  readonly isForbidden = this.advisorService.isForbidden;
  readonly isUnauthorized = this.advisorService.isUnauthorized;

  // --- Endpoint D (Manual Generation & Cooldown Signals) ---
  readonly isGenerating = this.advisorService.isGenerating;
  readonly cooldownSeconds = this.advisorService.cooldownSeconds;
  readonly hasManualGenerated = this.advisorService.hasManualGenerated;
  readonly formattedCooldown = computed(() => {
    const sec = this.cooldownSeconds();
    if (sec <= 0) return '';
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    if (mins > 0) {
      return `${mins}m ${remainder < 10 ? '0' : ''}${remainder}s`;
    }
    return `${sec}s`;
  });

  // --- Endpoint E: Per-insight in-flight tracking ---
  readonly updatingInsightIds = this.advisorService.updatingInsightIds;

  isInsightUpdating(id: string): boolean {
    return Boolean(this.updatingInsightIds()[id]);
  }

  // --- History Signals (Endpoint B) ---
  readonly historyResource = this.advisorService.historyResource;
  readonly historyItems = this.advisorService.historyItems;
  readonly historyTotal = this.advisorService.historyTotal;
  readonly historyTotalPages = this.advisorService.historyTotalPages;
  readonly historyPage = this.advisorService.historyPage;
  readonly historyLimit = this.advisorService.historyLimit;
  readonly historyFrom = this.advisorService.historyFrom;
  readonly historyTo = this.advisorService.historyTo;
  readonly isHistoryLoading = this.advisorService.isHistoryLoading;
  readonly historyError = this.advisorService.historyError;
  readonly isHistoryForbidden = this.advisorService.isHistoryForbidden;
  readonly historyValidationErrors = this.advisorService.historyValidationErrors;

  // --- Selected Single Brief Signals (Endpoint C) ---
  readonly selectedBriefId = this.advisorService.selectedBriefId;
  readonly selectedBrief = this.advisorService.selectedBrief;
  readonly isSelectedBriefLoading = this.advisorService.isSelectedBriefLoading;
  readonly selectedBriefError = this.advisorService.selectedBriefError;
  readonly isSelectedBriefNotFound = this.advisorService.isSelectedBriefNotFound;
  readonly isSelectedBriefForbidden = this.advisorService.isSelectedBriefForbidden;

  // --- Advisor Settings Signals (Endpoint F) ---
  readonly settingsResource = this.advisorService.settingsResource;
  readonly isSettingsLoading = this.advisorService.isSettingsLoading;
  readonly settingsError = this.advisorService.settingsError;
  readonly isSettingsForbidden = this.advisorService.isSettingsForbidden;
  readonly settings = this.advisorService.settings;

  // --- Section Editing States & Errors (Endpoint F PATCH) ---
  readonly sectionErrors = signal<Record<string, string | null>>({});
  readonly isEditingSchedule = signal<boolean>(false);
  readonly isEditingLocation = signal<boolean>(false);
  readonly isEditingLeadTime = signal<boolean>(false);

  isSectionSaving(sectionKey: string): boolean {
    return this.advisorService.isSectionSaving(sectionKey);
  }

  getSectionError(sectionKey: string): string | null {
    return this.sectionErrors()[sectionKey] ?? null;
  }

  private setSectionError(sectionKey: string, message: string | null) {
    this.sectionErrors.update((prev) => ({ ...prev, [sectionKey]: message }));
  }

  reloadSettings() {
    this.sectionErrors.set({});
    this.isEditingSchedule.set(false);
    this.isEditingLocation.set(false);
    this.isEditingLeadTime.set(false);
    this.advisorService.reloadSettings();
  }

  async toggleSchedule() {
    const s = this.settings();
    if (!s) return;
    this.setSectionError('schedule', null);
    try {
      await this.advisorService.patchSettings('schedule', {
        isEnabled: !s.isEnabled,
      });
      toast.success(
        s.isEnabled ? 'Daily brief schedule disabled.' : 'Daily brief schedule enabled.',
      );
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Failed to update schedule status.');
      this.setSectionError('schedule', msg);
      toast.error(msg);
    }
  }

  async saveSchedule(sendHourStr: string, timezoneVal: string) {
    const hour = parseInt(sendHourStr, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      this.setSectionError('schedule', 'Send hour must be between 0 and 23.');
      return;
    }
    const tz = timezoneVal.trim() ? timezoneVal.trim() : null;
    this.setSectionError('schedule', null);

    try {
      await this.advisorService.patchSettings('schedule', {
        sendHour: hour,
        timezone: tz,
      });
      this.isEditingSchedule.set(false);
      toast.success('Schedule settings updated.');
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Failed to update schedule.');
      this.setSectionError('schedule', msg);
      toast.error(msg);
    }
  }

  async toggleEmail() {
    const s = this.settings();
    if (!s) return;
    this.setSectionError('email', null);
    try {
      await this.advisorService.patchSettings('email', {
        emailEnabled: !s.emailEnabled,
      });
      toast.success(
        s.emailEnabled ? 'Owner email delivery disabled.' : 'Owner email delivery enabled.',
      );
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Failed to update email delivery.');
      this.setSectionError('email', msg);
      toast.error(msg);
    }
  }

  async saveLocation(cityVal: string, countryVal: string, latVal: string, lngVal: string) {
    const city = cityVal.trim() || null;
    const country = countryVal.trim() ? countryVal.trim().toUpperCase() : null;
    const latStr = latVal.trim();
    const lngStr = lngVal.trim();

    if (country && country.length !== 2) {
      this.setSectionError('location', 'Country code must be exactly 2 letters (e.g. EG, US).');
      return;
    }

    let lat: number | null = null;
    let lng: number | null = null;

    if (latStr || lngStr) {
      if (!latStr || !lngStr) {
        this.setSectionError('location', 'Both Latitude and Longitude must be provided together.');
        return;
      }
      lat = parseFloat(latStr);
      lng = parseFloat(lngStr);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        this.setSectionError('location', 'Latitude must be between -90 and 90.');
        return;
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        this.setSectionError('location', 'Longitude must be between -180 and 180.');
        return;
      }
    }

    this.setSectionError('location', null);

    try {
      await this.advisorService.patchSettings('location', {
        city,
        countryCode: country,
        latitude: lat,
        longitude: lng,
      });
      this.isEditingLocation.set(false);
      toast.success('Location settings updated.');
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Failed to update location.');
      this.setSectionError('location', msg);
      toast.error(msg);
    }
  }

  async clearLocation() {
    this.setSectionError('location', null);
    try {
      await this.advisorService.patchSettings('location', {
        latitude: null,
        longitude: null,
        city: null,
      });
      this.isEditingLocation.set(false);
      toast.success('Weather location cleared. Weather advice is now disabled.');
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Failed to clear location.');
      this.setSectionError('location', msg);
      toast.error(msg);
    }
  }

  async saveLeadTime(daysStr: string) {
    const days = parseInt(daysStr, 10);
    if (isNaN(days) || days < 0 || days > 120) {
      this.setSectionError('leadTime', 'Lead time must be between 0 and 120 days.');
      return;
    }

    this.setSectionError('leadTime', null);

    try {
      await this.advisorService.patchSettings('leadTime', {
        leadTimeDays: days,
      });
      this.isEditingLeadTime.set(false);
      toast.success('Supplier lead time updated.');
    } catch (err: unknown) {
      const msg = this.extractErrorMessage(err, 'Failed to update lead time.');
      this.setSectionError('leadTime', msg);
      toast.error(msg);
    }
  }

  private extractErrorMessage(err: unknown, defaultMsg: string): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 403) return 'Action restricted to Store Owners and Admins.';
      if (err.status === 401) return 'Session expired. Please log in again.';
      if (err.error?.message) {
        return Array.isArray(err.error.message)
          ? err.error.message.join(', ')
          : String(err.error.message);
      }
    }
    return defaultMsg;
  }

  readonly hasHistoryDateFilter = computed(
    () => Boolean(this.historyFrom()) || Boolean(this.historyTo()),
  );

  /**
   * Formatted brief date for stale indicator framing (e.g. "Tuesday, Oct 14")
   */
  readonly formattedBriefDate = computed(() => {
    const b = this.brief();
    if (!b?.briefDate) return '';
    return this.formatCalendarDate(b.briefDate);
  });

  /**
   * Formatted calendar date for currently opened historical brief
   */
  readonly formattedSelectedBriefDate = computed(() => {
    const b = this.selectedBrief();
    if (!b?.briefDate) return '';
    return this.formatCalendarDate(b.briefDate);
  });

  setActiveView(view: AdvisorPanelTab) {
    this.activeView.set(view);
  }

  /**
   * `hlm-tabs` (via `BrnTabs`) emits the activated tab id as a plain `string` since the
   * directive is not generic over the id union. Narrow it back to `AdvisorPanelTab` before
   * writing it into `activeView` — both header switchers (full-page and sheet) only ever
   * register triggers for the three known ids, so this narrows safely.
   */
  onTabActivated(id: string): void {
    if (id === 'today' || id === 'history' || id === 'settings') {
      this.setActiveView(id);
    }
  }

  setFilter(filter: AdvisorFilter) {
    this.advisorService.setFilter(filter);
  }

  reload() {
    this.advisorService.reload();
  }

  /**
   * Endpoint D Action: Triggers manual generation with user feedback
   */
  async generateNow() {
    try {
      await this.advisorService.generateNow();
      toast.success('Daily brief generated successfully!');
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse && err.status === 429) {
        toast.warning(
          err.error?.message ||
            'Generation cooldown in effect. Please wait before generating another brief.',
        );
      } else if (err instanceof HttpErrorResponse && err.status === 403) {
        toast.error('AI Advisor generation is restricted to Store Owners and Admins.');
      } else {
        toast.error('Failed to generate daily brief. Please try again.');
      }
    }
  }

  // --- History Controls (Endpoint B & C) ---

  setHistoryPage(page: number) {
    this.advisorService.setHistoryPage(page);
  }

  onFromDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.advisorService.setHistoryDateRange(input.value, this.historyTo());
  }

  onToDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.advisorService.setHistoryDateRange(this.historyFrom(), input.value);
  }

  setHistoryDates(from: string, to: string) {
    this.advisorService.setHistoryDateRange(from, to);
  }

  selectBrief(id: string | null) {
    this.advisorService.selectBrief(id);
  }

  resetHistoryFilters() {
    this.advisorService.resetHistoryFilters();
  }

  reloadHistory() {
    this.advisorService.reloadHistory();
  }

  openBriefDetail(id: string) {
    this.advisorService.selectBrief(id);
  }

  closeBriefDetail() {
    this.advisorService.selectBrief(null);
  }

  reloadSelectedBrief() {
    this.advisorService.reloadSelectedBrief();
  }

  /**
   * Parses YYYY-MM-DD safely into a store-calendar date representation without client timezone shift
   */
  formatCalendarDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (!year || !month || !day) return dateStr;
      const date = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch {
      return dateStr;
    }
  }

  // --- Type Narrowing Helpers ---
  asStockout(payload: InsightPayload): StockoutPayload {
    return payload as StockoutPayload;
  }

  asRestock(payload: InsightPayload): RestockPayload {
    return payload as RestockPayload;
  }

  asTrending(payload: InsightPayload): TrendingPayload {
    return payload as TrendingPayload;
  }

  asSlowMover(payload: InsightPayload): SlowMoverPayload {
    return payload as SlowMoverPayload;
  }

  asDemandGap(payload: InsightPayload): DemandGapPayload {
    return payload as DemandGapPayload;
  }

  asSeasonalEvent(payload: InsightPayload): SeasonalEventPayload {
    return payload as SeasonalEventPayload;
  }

  asSeasonal(payload: InsightPayload): SeasonalEventPayload {
    return payload as SeasonalEventPayload;
  }

  asWeather(payload: InsightPayload): WeatherPayload {
    return payload as WeatherPayload;
  }

  // --- Shared Business Rule Presentation Helpers (Endpoints A & C) ---

  /**
   * Rule #2: Money fields (estimatedDailyLoss, tiedUpAmount) are in minor units.
   * Divide by 100 before formatting.
   */
  formatMinorUnits(minorUnits: number): string {
    const major = (minorUnits || 0) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major);
  }

  /**
   * Icon representation per insight kind
   */
  getInsightIcon(kind: InsightKind): string {
    switch (kind) {
      case 'stockout':
        return 'lucidePackageX';
      case 'restock':
        return 'lucidePackage';
      case 'trending':
        return 'lucideTrendingUp';
      case 'slow_mover':
        return 'lucideClock';
      case 'demand_gap':
        return 'lucideHelpCircle';
      case 'seasonal_event':
        return 'lucideCalendar';
      case 'weather':
        return 'lucideCloudSun';
      default:
        return 'lucideSparkles';
    }
  }

  /**
   * Severity label formatting
   */
  getSeverityLabel(severity: InsightSeverity): string {
    switch (severity) {
      case 'critical':
        return 'Critical';
      case 'warning':
        return 'Warning';
      case 'info':
      default:
        return 'Insight';
    }
  }

  severityLabel(severity: InsightSeverity): string {
    return this.getSeverityLabel(severity);
  }

  /**
   * Severity icon color classes
   */
  getInsightIconColor(severity: InsightSeverity): string {
    switch (severity) {
      case 'critical':
        return 'text-destructive';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'info':
      default:
        return 'text-primary';
    }
  }

  /**
   * Returns product routing URL if the insight has an associated productId
   */
  getProductUrl(item: Insight): string | null {
    if (
      item.kind === 'stockout' ||
      item.kind === 'restock' ||
      item.kind === 'trending' ||
      item.kind === 'slow_mover'
    ) {
      const payload = item.payload as
        | StockoutPayload
        | RestockPayload
        | TrendingPayload
        | SlowMoverPayload;
      return payload.productId ? `/products/${payload.productId}` : null;
    }
    return null;
  }

  /**
   * Action button text for actionable insights
   */
  getActionButtonText(kind: InsightKind): string {
    switch (kind) {
      case 'stockout':
      case 'restock':
        return 'Draft Reorder';
      case 'trending':
        return 'View Trends';
      case 'slow_mover':
        return 'Plan Sale';
      case 'demand_gap':
        return 'Add Product';
      case 'seasonal_event':
        return 'Review Stock';
      case 'weather':
      default:
        return 'Mark Acted';
    }
  }

  /**
   * Action button icon for actionable insights
   */
  getActionIcon(kind: InsightKind): string {
    switch (kind) {
      case 'stockout':
      case 'restock':
        return 'lucideMail';
      case 'trending':
        return 'lucideTrendingUp';
      case 'slow_mover':
        return 'lucideTag';
      case 'demand_gap':
        return 'lucideArrowRight';
      case 'seasonal_event':
        return 'lucideCalendar';
      case 'weather':
      default:
        return 'lucideCheck';
    }
  }

  /**
   * Rule #6: Null-safe formatting for ratio and daysSinceLastSale
   */
  formatTrendingRatio(ratio: number | null): string {
    if (ratio === null) {
      return 'with none sold before';
    }
    return `${ratio.toFixed(1)}× vs baseline`;
  }

  formatDaysSinceLastSale(days: number | null): string {
    if (days === null) {
      return 'Never sold';
    }
    return `${days}d since last sale`;
  }

  /**
   * Endpoint E Action: Handles user actions for marking an insight as acted or dismissed.
   */
  async markInsight(item: Insight, status: 'acted' | 'dismissed'): Promise<void> {
    try {
      await this.advisorService.markInsight(item.id, status);
      if (status === 'dismissed') {
        toast.success('Recommendation dismissed');
      } else {
        toast.success('Marked recommendation as acted');
      }
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        toast.error('Recommendation not found. It may have already expired.');
      } else if (err instanceof HttpErrorResponse && err.status === 403) {
        toast.error('Action restricted to Store Owners and Admins.');
      } else {
        toast.error('Failed to update recommendation status. Please try again.');
      }
    }
  }
}
