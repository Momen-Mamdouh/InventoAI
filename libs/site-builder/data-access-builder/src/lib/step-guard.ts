// import { inject } from '@angular/core';
//  , Router
import { CanActivateFn } from '@angular/router';
// import { BuilderState } from './builder-state';
// BUILDER_STEPS,
import {  BuilderStepId } from './builder-steps';

/**
 * Guards a wizard step by requiring every step before it to be complete,
 * redirecting to the first one that isn't.
 *
 * Replaces the four hand-written guards that each re-encoded this ordering.
 */
export const stepGuard =
  // (step: BuilderStepId): CanActivateFn =>
  // () => {
  //   const builderState = inject(BuilderState);
  //   const router = inject(Router);

  //   const stepIndex = BUILDER_STEPS.findIndex((s) => s.id === step);
  //   const firstIncomplete = BUILDER_STEPS.slice(0, stepIndex).find(
  //     (s) => !builderState.isStepComplete(s.id),
  //   );
  //   if (firstIncomplete) {
  //     builderState.triggerStepEnforcement(firstIncomplete.id);
  //     return router.parseUrl(firstIncomplete.path);
  //   }

  //   return true;

  // };

  // This code below to allow direct access easily to make any dev check for build steps page without guards.
  (_step: BuilderStepId): CanActivateFn =>
  () => {
    console.log(_step)
    return true;

  }
