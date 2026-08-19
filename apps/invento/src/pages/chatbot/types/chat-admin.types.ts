export interface KnowledgeSource {
  sourceType: 'product' | 'faq' | 'category' | 'store_profile';
  total: number;
  indexed: number;
  stale: number;
  failed: number;
}

export interface KnowledgeStatus {
  total: number;
  indexed: number;
  stale: number;
  failed: number;
  lastIndexedAt: string | null;
  vectorSearchAvailable: boolean;
  embeddingModel: string;
  sources: KnowledgeSource[];
}

export interface ChatSessionPreview {
  id: string;
  isSignedIn: boolean;
  customerName: string | null;
  customerEmail: string | null;
  messageCount: number;
  unansweredCount: number;
  preview: string | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface ChatSessionsResponse {
  items: ChatSessionPreview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChatMessageSources {
  productIds: string[];
  faqIds: string[];
  orderId: string | null;
}

export interface ChatTranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  resolution: 'answered' | 'unanswered' | 'off_topic' | 'needs_login' | 'error' | null;
  sources: ChatMessageSources | null;
  latencyMs: number | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ChatTranscript {
  id: string;
  isSignedIn: boolean;
  customerName: string | null;
  customerEmail: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  messages: ChatTranscriptMessage[];
}

export interface UnansweredTheme {
  key: string;
  label: string;
  occurrences: number;
  exampleQuestion: string;
  lastAskedAt: string;
  messageIds: string[];
  isReviewed: boolean;
}

export interface UnansweredResponse {
  items: UnansweredTheme[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TopProduct {
  productId: string;
  title: string;
  slug: string;
  occurrences: number;
}

export interface ChatStats {
  days: number;
  from: string;
  sessions: number;
  messages: number;
  questions: number;
  byResolution: {
    answered: number;
    unanswered: number;
    off_topic: number;
    needs_login: number;
    error: number;
  };
  unansweredThemes: number;
  topProducts: TopProduct[];
}

export interface ChatbotSettings {
  isEnabled: boolean;
  greeting: string | null;
  effectiveGreeting: string;
  tone: 'friendly' | 'formal' | 'playful';
  contactEmail: string | null;
  updatedAt: string;
}

export interface UpdateChatbotSettingsDto {
  isEnabled?: boolean;
  greeting?: string | null;
  tone?: 'friendly' | 'formal' | 'playful';
  contactEmail?: string | null;
}
