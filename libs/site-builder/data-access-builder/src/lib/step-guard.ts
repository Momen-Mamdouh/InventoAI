import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { BuilderState } from './builder-state';
import { BUILDER_STEPS, BuilderStepId } from './builder-steps';

/**
 * Guards a wizard step by requiring every step before it to be complete,
 * redirecting to the first one that isn't.
 * Ensures backend hydration before evaluating completion so that refreshed
 * or returning owners are not blocked from their legitimate progress.
 */
export const stepGuard =
  (step: BuilderStepId): CanActivateFn =>
  (): Observable<boolean | UrlTree> => {
    const builderState = inject(BuilderState);
    const router = inject(Router);

    return builderState.hydrateFromBackend().pipe(
      map((outcome) => {
        if (outcome.hasLiveStore) {
          return router.parseUrl('/home');
        }

        const stepIndex = BUILDER_STEPS.findIndex((s) => s.id === step);
        const firstIncomplete = BUILDER_STEPS.slice(0, stepIndex).find(
          (s) => !builderState.isStepComplete(s.id),
        );

        if (firstIncomplete) {
          builderState.triggerStepEnforcement(firstIncomplete.id);
          return router.parseUrl(firstIncomplete.path);
        }

        return true;
      }),
    );
  };
