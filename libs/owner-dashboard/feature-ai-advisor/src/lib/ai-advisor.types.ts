export type InsightKind =
  | 'stockout'
  | 'restock'
  | 'trending'
  | 'slow_mover'
  | 'demand_gap'
  | 'seasonal_event'
  | 'weather';

export type InsightSeverity = 'critical' | 'warning' | 'info';
export type InsightStatus = 'new' | 'acted' | 'dismissed';
export type NarratorStatus = 'ai' | 'fallback';
export type GeneratedBy = 'schedule' | 'manual';

export interface StockoutPayload {
  productId: string;
  productTitle: string;
  variantId: string;
  variantLabel: string | null;
  unitsSoldRecent: number;
  estimatedDailyLoss: number; // minor units (e.g. 11371 = 113.71)
}

export interface RestockPayload {
  productId: string;
  productTitle: string;
  variantId: string;
  variantLabel: string | null;
  stockQuantity: number;
  unitsPerDay: number; // 2 decimals
  daysOfCoverage: number; // 2 decimals
  recommendedQuantity: number;
  leadTimeDays: number;
}

export interface TrendingPayload {
  productId: string;
  productTitle: string;
  recentUnits: number;
  baselineUnits: number;
  ratio: number | null; // null = nothing sold in the baseline window
}

export interface SlowMoverPayload {
  productId: string;
  productTitle: string;
  stockQuantity: number;
  tiedUpAmount: number; // minor units
  daysSinceLastSale: number | null; // null = never sold at all
}

export interface DemandGapPayload {
  label: string;
  occurrences: number;
  exampleQuestion: string;
  lastAskedAt: string; // ISO date-time
}

export interface SeasonalEventPayload {
  eventKey: string;
  eventName: string;
  startsOn: string;
  daysUntil: number;
  matchedCategoryIds: string[];
  matchedCategoryNames: string[];
}

export interface WeatherPayload {
  anomaly: string;
  maxTempC: number;
  minTempC: number;
  precipitationMm: number;
  onDate: string;
}

export type InsightPayload =
  | StockoutPayload
  | RestockPayload
  | TrendingPayload
  | SlowMoverPayload
  | DemandGapPayload
  | SeasonalEventPayload
  | WeatherPayload;

export interface Insight {
  id: string; // used by PATCH /advisor/insights/{id}
  kind: InsightKind;
  severity: InsightSeverity;
  title: string; // plain text — render as text, never innerHTML
  body: string; // prose, quotes the payload's numbers in words
  payload: InsightPayload; // shape depends on `kind`
  status: InsightStatus;
  statusChangedAt: string | null; // null while status === 'new'
  position: number; // render order — never sort by anything else
}

export interface Brief {
  id: string;
  briefDate: string; // YYYY-MM-DD, store's local calendar day
  headline: string; // one-sentence summary / email subject line
  insightCount: number; // how many lines were kept, capped at 8
  generatedBy: GeneratedBy;
  narratorStatus: NarratorStatus;
  emailedAt: string | null;
  createdAt: string;
  insights: Insight[];
}

export interface TodaysBriefResponse {
  brief: Brief | null; // null = store has never had a brief written
  isStale: boolean; // true = newest brief isn't today's
}

// Endpoint B: GET /advisor/briefs
export interface BriefSummary {
  id: string;
  briefDate: string; // YYYY-MM-DD
  headline: string;
  insightCount: number;
  generatedBy: GeneratedBy;
  narratorStatus: NarratorStatus;
  emailedAt: string | null;
  createdAt: string;
}

export interface ListBriefsResponse {
  items: BriefSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListBriefsParams {
  page?: number;
  limit?: number;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

// Endpoint E: PATCH /advisor/insights/{id}
export interface UpdateInsightStatusRequest {
  status: 'acted' | 'dismissed';
}

// Endpoint F: GET & PATCH /advisor/settings
export interface AdvisorSettings {
  isEnabled: boolean; // false stops the SCHEDULED brief only — POST /advisor/generate still works regardless
  emailEnabled: boolean; // whether the brief is also emailed to the store owner — admins never receive it
  sendHour: number; // 0–23, on the store's OWN wall clock
  timezone: string | null; // what is actually STORED — null if the owner never explicitly chose one
  effectiveTimezone: string; // what the scheduler will actually use (stored zone, or platform default) — never null
  countryCode: string | null; // ISO 3166-1 alpha-2, uppercase
  city: string | null; // display only — the forecast itself is fetched from lat/lng below
  latitude: number | null;
  longitude: number | null;
  hasWeatherLocation: boolean; // true exactly when BOTH latitude and longitude are set
  leadTimeDays: number; // store-wide supplier lead time
  updatedAt: string;
}

export interface UpdateAdvisorSettingsRequest {
  isEnabled?: boolean; // default true
  emailEnabled?: boolean; // default true
  sendHour?: number; // 0–23, default 7
  timezone?: string | null; // IANA zone name, e.g. "Africa/Cairo"; explicit null falls back to platform default
  countryCode?: string | null; // exactly 2 letters; lowercase accepted, uppercased server-side; explicit null clears it
  city?: string | null; // max 120 chars; display only
  latitude?: number | null; // -90..90
  longitude?: number | null; // -180..180
  leadTimeDays?: number; // 0–120, default 10
}

// --- Legacy / Compatibility aliases ---
export type RecommendationUrgency = 'critical' | 'watch' | 'ok';
export type RecommendationType = 'restock' | 'overstock';
export interface RestockRecommendation {
  id: string;
  productName: string;
  sku: string;
  imageUrl?: string;
  stockCount: number;
  soldLast30d: number;
  urgency: RecommendationUrgency;
  type: RecommendationType;
  description: string;
  suggestion: string;
  productUrl: string;
}
