import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BuilderState } from './builder-state';
import { BUILDER_STEPS, BuilderStepId } from './builder-steps';

/**
 * Guards a wizard step by requiring every step before it to be complete,
 * redirecting to the first one that isn't.
 *
 * Replaces the four hand-written guards that each re-encoded this ordering.
 */
export const stepGuard =
  (step: BuilderStepId): CanActivateFn =>
  () => {
    const builderState = inject(BuilderState);
    const router = inject(Router);

    const stepIndex = BUILDER_STEPS.findIndex((s) => s.id === step);
    const firstIncomplete = BUILDER_STEPS.slice(0, stepIndex).find(
      (s) => !builderState.isStepComplete(s.id),
    );

    return firstIncomplete ? router.parseUrl(firstIncomplete.path) : true;
  };
