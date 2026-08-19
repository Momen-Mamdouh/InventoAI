export interface FaqItem {
  readonly id?: string;
  readonly question: string;
  readonly answer: string;
  readonly category?: string;
}

export interface FaqCategory {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly items: readonly FaqItem[];
}

export interface FaqErrorResponse {
  readonly message: string;
  readonly error: string;
  readonly statusCode: number;
}
