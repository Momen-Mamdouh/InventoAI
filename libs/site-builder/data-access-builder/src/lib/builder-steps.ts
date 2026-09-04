/** Minimum characters before a brainstorm description is considered usable. */
export const MIN_BRAINSTORM_LENGTH = 25;

export type BuilderStepId = 'brainstorm' | 'ai-interview' | 'validation' | 'preview';

export interface BuilderStepConfig {
  readonly id: BuilderStepId;
  readonly path: string;
  readonly labelKey: string;
}

/**
 * The wizard's steps, in order. Single source of truth for the steps bar,
 * the route guards, and BuilderState's completeness checks — these three used
 * to encode the same ordering independently.
 */
export const BUILDER_STEPS: readonly BuilderStepConfig[] = [
  { id: 'brainstorm', path: '/build/brainstorm', labelKey: 'step_brainstorm' },
  { id: 'ai-interview', path: '/build/ai-interview', labelKey: 'step_ai_interview' },
  { id: 'validation', path: '/build/validation', labelKey: 'step_validation' },
  { id: 'preview', path: '/build/preview', labelKey: 'step_preview' },
] as const;
