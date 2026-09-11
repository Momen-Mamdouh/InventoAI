import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { BuilderState } from './builder-state';
import { LocaleService } from '@invento/shared-util-i18n';
import { toast } from 'ngx-sonner';

/**
 * Functional guard for the wizard root (`/build`).
 * Ensures state is hydrated from the backend and persistent storage, then
 * routes the owner directly to their active step without forcing them to
 * re-enter completed steps or make redundant AI calls.
 */
export const builderResumeGuard: CanActivateFn = (): Observable<UrlTree> => {
  const builderState = inject(BuilderState);
  const router = inject(Router);
  const localeService = inject(LocaleService);

  return builderState.hydrateFromBackend().pipe(
    map((outcome) => {
      if (outcome.hasLiveStore) {
        toast.info(localeService.translate('toast_has_existing_store'), {
          id: 'existing-store-guard-toast',
        });
        return router.createUrlTree(['/home']);
      }

      if (outcome.isThemed) {
        return router.createUrlTree(['/build/preview']);
      }

      if (outcome.isDomainConfirmed || outcome.isAiInterviewComplete) {
        return router.createUrlTree(['/build/validation']);
      }

      if (outcome.isBrainstormComplete) {
        return router.createUrlTree(['/build/ai-interview']);
      }

      return router.createUrlTree(['/build/brainstorm']);
    }),
  );
};
