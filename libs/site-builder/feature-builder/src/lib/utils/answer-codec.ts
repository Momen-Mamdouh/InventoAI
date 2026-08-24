import { InterviewQuestionConfig } from '@invento/site-builder-data-access-builder';

export type FormAnswer = string | string[];
/** Wire format: option indices for choice questions, free text for text questions. */
export type WireAnswer = string | number | number[] | null;
export type RawAnswer = string | number | string[] | number[] | null | undefined;

/**
 * Translates between the option *labels* the form binds to and the option
 * *indices* the API speaks.
 *
 * The brainstorm endpoint pre-fills answers in whichever form its model
 * produced — an index, an index as a string, an exact label, or an
 * approximate label — so decoding has to tolerate all four. Encoding is
 * strict: only an exact label match becomes an index.
 */

/** API/prefill value -> the value the form control should hold. */
export function decodeAnswer(question: InterviewQuestionConfig, raw: RawAnswer): FormAnswer {
  const empty: FormAnswer = question.type === 'multi' ? [] : '';
  if (raw === null || raw === undefined) return empty;

  if (question.type === 'multi') {
    const parts = Array.isArray(raw) ? raw : String(raw).split(',');
    return parts.map((part) => resolveOption(question, part));
  }

  if (question.type === 'single') {
    return resolveOption(question, raw as string | number);
  }

  return String(raw);
}

/** Form control value -> the value the API expects. */
export function encodeAnswer(question: InterviewQuestionConfig, value: unknown): WireAnswer {
  if (question.type === 'text') {
    const text = (value ?? '').toString().trim();
    return text || null;
  }

  if (question.type === 'single') {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;

    const text = String(value).trim();
    // Sentinel option: the user explicitly deferred to the AI, which the API
    // represents as "no answer".
    if (text.toLowerCase() === 'let ai choose') return null;

    const index = indexOfLabel(question, text);
    return index === -1 ? null : index;
  }

  if (question.type === 'multi') {
    const items = Array.isArray(value) ? value : [];
    const indices = items
      .map((item) => (typeof item === 'number' ? item : indexOfExactOrNumeric(question, item)))
      .filter((index) => index !== -1);
    return indices.length > 0 ? indices : null;
  }

  return null;
}

/** True when every required question has a usable answer. */
export function isAnswered(question: InterviewQuestionConfig, value: unknown): boolean {
  if (question.type === 'multi') return Array.isArray(value) && value.length > 0;
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function resolveOption(question: InterviewQuestionConfig, raw: string | number): string {
  const options = question.options ?? [];

  if (typeof raw === 'number' && options[raw] !== undefined) return options[raw];

  const text = String(raw).trim();

  if (/^\d+$/.test(text) && options[parseInt(text, 10)] !== undefined) {
    return options[parseInt(text, 10)];
  }

  const exact = options.find((opt) => opt.toLowerCase() === text.toLowerCase());
  if (exact) return exact;

  // Fuzzy match so a model answer like "mid range pricing" still selects
  // "Mid-range" rather than dropping the pre-fill entirely.
  const approximate = options.find(
    (opt) =>
      opt.toLowerCase().includes(text.toLowerCase()) ||
      text.toLowerCase().includes(opt.toLowerCase()),
  );
  return approximate ?? text;
}

function indexOfLabel(question: InterviewQuestionConfig, label: string): number {
  return (question.options ?? []).findIndex((opt) => opt.toLowerCase() === label.toLowerCase());
}

function indexOfExactOrNumeric(question: InterviewQuestionConfig, item: unknown): number {
  const text = String(item).trim();
  if (/^\d+$/.test(text)) return parseInt(text, 10);
  return indexOfLabel(question, text);
}
