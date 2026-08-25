export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  position: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaqDto {
  question: string; // 5–300 chars
  answer: string; // 1–2000 chars, plain text, line breaks kept
  isPublished?: boolean; // defaults to true server-side
}

export interface UpdateFaqDto {
  question?: string;
  answer?: string;
  isPublished?: boolean;
  // position is intentionally NOT here - it moves through /faqs/reorder only
}

export interface ReorderFaqItem {
  id: string;
  position: number;
}

export interface ApiErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}
