import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, firstValueFrom, Observable } from 'rxjs';
import {
  stepGuard,
  builderResumeGuard,
  BuilderState,
  HydrationOutcome,
} from '@invento/site-builder-data-access-builder';
import { LocaleService } from '@invento/shared-util-i18n';
import { toast } from 'ngx-sonner';

describe('Step and Resumption Guards', () => {
  let routerMock: {
    parseUrl: ReturnType<typeof vi.fn>;
    createUrlTree: ReturnType<typeof vi.fn>;
  };
  let localeServiceMock: { translate: ReturnType<typeof vi.fn> };
  let builderStateMock: {
    hydrateFromBackend: ReturnType<typeof vi.fn>;
    isStepComplete: ReturnType<typeof vi.fn>;
    triggerStepEnforcement: ReturnType<typeof vi.fn>;
  };
  let toastInfoSpy: ReturnType<typeof vi.spyOn>;

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    toastInfoSpy = vi.spyOn(toast, 'info').mockImplementation(() => '');
    vi.clearAllMocks();

    routerMock = {
      parseUrl: vi.fn((url: string) => ({ toString: () => url }) as unknown as UrlTree),
      createUrlTree: vi.fn(
        (commands: string[]) => ({ toString: () => commands.join('/') }) as unknown as UrlTree,
      ),
    };

    localeServiceMock = {
      translate: vi.fn((key: string) => key),
    };

    builderStateMock = {
      hydrateFromBackend: vi.fn(),
      isStepComplete: vi.fn(),
      triggerStepEnforcement: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: LocaleService, useValue: localeServiceMock },
        { provide: BuilderState, useValue: builderStateMock },
      ],
    });
  });

  describe('stepGuard', () => {
    it('redirects to /home and toasts when owner has a live store', async () => {
      const outcome: HydrationOutcome = {
        hasLiveStore: true,
        isThemed: false,
        isDomainConfirmed: false,
        isAiInterviewComplete: false,
        isBrainstormComplete: false,
      };
      builderStateMock.hydrateFromBackend.mockReturnValue(of(outcome));

      const guard = stepGuard('brainstorm');
      const result$ = TestBed.runInInjectionContext(() =>
        guard(dummyRoute, dummyState),
      ) as Observable<boolean | UrlTree>;

      const result = await firstValueFrom(result$);
      expect(routerMock.parseUrl).toHaveBeenCalledWith('/home');
      expect(toastInfoSpy).toHaveBeenCalledWith('toast_has_existing_store', {
        id: 'existing-store-guard-toast',
      });
      expect(result.toString()).toBe('/home');
    });

    it('allows access to brainstorm immediately when no steps are required before it', async () => {
      const outcome: HydrationOutcome = {
        hasLiveStore: false,
        isThemed: false,
        isDomainConfirmed: false,
        isAiInterviewComplete: false,
        isBrainstormComplete: false,
      };
      builderStateMock.hydrateFromBackend.mockReturnValue(of(outcome));

      const guard = stepGuard('brainstorm');
      const result$ = TestBed.runInInjectionContext(() =>
        guard(dummyRoute, dummyState),
      ) as Observable<boolean | UrlTree>;

      const result = await firstValueFrom(result$);
      expect(result).toBe(true);
      expect(builderStateMock.triggerStepEnforcement).not.toHaveBeenCalled();
    });

    it('blocks forward access to ai-interview when brainstorm is incomplete', async () => {
      const outcome: HydrationOutcome = {
        hasLiveStore: false,
        isThemed: false,
        isDomainConfirmed: false,
        isAiInterviewComplete: false,
        isBrainstormComplete: false,
      };
      builderStateMock.hydrateFromBackend.mockReturnValue(of(outcome));
      builderStateMock.isStepComplete.mockReturnValue(false);

      const guard = stepGuard('ai-interview');
      const result$ = TestBed.runInInjectionContext(() =>
        guard(dummyRoute, dummyState),
      ) as Observable<boolean | UrlTree>;

      const result = await firstValueFrom(result$);
      expect(builderStateMock.triggerStepEnforcement).toHaveBeenCalledWith('brainstorm');
      expect(routerMock.parseUrl).toHaveBeenCalledWith('/build/brainstorm');
      expect(result.toString()).toBe('/build/brainstorm');
    });

    it('allows access to validation when previous steps are complete', async () => {
      const outcome: HydrationOutcome = {
        hasLiveStore: false,
        isThemed: false,
        isDomainConfirmed: false,
        isAiInterviewComplete: true,
        isBrainstormComplete: true,
      };
      builderStateMock.hydrateFromBackend.mockReturnValue(of(outcome));
      builderStateMock.isStepComplete.mockReturnValue(true);

      const guard = stepGuard('validation');
      const result$ = TestBed.runInInjectionContext(() =>
        guard(dummyRoute, dummyState),
      ) as Observable<boolean | UrlTree>;

      const result = await firstValueFrom(result$);
      expect(result).toBe(true);
    });

    it('blocks access to preview if validation is not complete', async () => {
      const outcome: HydrationOutcome = {
        hasLiveStore: false,
        isThemed: false,
        isDomainConfirmed: false,
        isAiInterviewComplete: true,
        isBrainstormComplete: true,
      };
      builderStateMock.hydrateFromBackend.mockReturnValue(of(outcome));
      builderStateMock.isStepComplete.mockImplementation((stepId: string) => {
        return stepId !== 'validation';
      });

      const guard = stepGuard('preview');
      const result$ = TestBed.runInInjectionContext(() =>
        guard(dummyRoute, dummyState),
      ) as Observable<boolean | UrlTree>;

      const result = await firstValueFrom(result$);
      expect(builderStateMock.triggerStepEnforcement).toHaveBeenCalledWith('validation');
      expect(routerMock.parseUrl).toHaveBeenCalledWith('/build/validation');
      expect(result.toString()).toBe('/build/validation');
    });
  });

  describe('builderResumeGuard', () => {
    it('redirects to /home when user already has a live store', async () => {
      const outcome: HydrationOutcome = {
        hasLiveStore: true,
        isThemed: false,
        isDomainConfirmed: false,
        isAiInterviewComplete: false,
        isBrainstormComplete: false,
      };
      builderStateMock.hydrateFromBackend.mockReturnValue(of(outcome));

      const result$ = TestBed.runInInjectionContext(() =>
        builderResumeGuard(dummyRoute, dummyState),
      ) as Observable<UrlTree>;

      const result = await firstValueFrom(result$);
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/home']);
      expect(toastInfoSpy).toHaveBeenCalledWith('toast_has_existing_store', {
        id: 'existing-store-guard-toast',
      });
      expect(result.toString()).toBe('/home');
    });

    it('routes directly to preview when isThemed is true', async () => {
      const outcome: HydrationOutcome = {
        hasLiveStore: false,
        isThemed: true,
        isDomainConfirmed: true,
        isAiInterviewComplete: true,
        isBrainstormComplete: true,
      };
      builderStateMock.hydrateFromBackend.mockReturnValue(of(outcome));

      const result$ = TestBed.runInInjectionContext(() =>
        builderResumeGuard(dummyRoute, dummyState),
      ) as Observable<UrlTree>;

      const result = await firstValueFrom(result$);
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/build/preview']);
      expect(result.toString()).toBe('/build/preview');
    });

    it('routes to validation when isDomainConfirmed or isAiInterviewComplete is true', async () => {
      const outcome: HydrationOutcome = {
        hasLiveStore: false,
        isThemed: false,
        isDomainConfirmed: false,
        isAiInterviewComplete: true,
        isBrainstormComplete: true,
      };
      builderStateMock.hydrateFromBackend.mockReturnValue(of(outcome));

      const result$ = TestBed.runInInjectionContext(() =>
        builderResumeGuard(dummyRoute, dummyState),
      ) as Observable<UrlTree>;

      const result = await firstValueFrom(result$);
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/build/validation']);
      expect(result.toString()).toBe('/build/validation');
    });

    it('routes to ai-interview when only isBrainstormComplete is true', async () => {
      const outcome: HydrationOutcome = {
        hasLiveStore: false,
        isThemed: false,
        isDomainConfirmed: false,
        isAiInterviewComplete: false,
        isBrainstormComplete: true,
      };
      builderStateMock.hydrateFromBackend.mockReturnValue(of(outcome));

      const result$ = TestBed.runInInjectionContext(() =>
        builderResumeGuard(dummyRoute, dummyState),
      ) as Observable<UrlTree>;

      const result = await firstValueFrom(result$);
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/build/ai-interview']);
      expect(result.toString()).toBe('/build/ai-interview');
    });

    it('routes to brainstorm when no steps are complete', async () => {
      const outcome: HydrationOutcome = {
        hasLiveStore: false,
        isThemed: false,
        isDomainConfirmed: false,
        isAiInterviewComplete: false,
        isBrainstormComplete: false,
      };
      builderStateMock.hydrateFromBackend.mockReturnValue(of(outcome));

      const result$ = TestBed.runInInjectionContext(() =>
        builderResumeGuard(dummyRoute, dummyState),
      ) as Observable<UrlTree>;

      const result = await firstValueFrom(result$);
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/build/brainstorm']);
      expect(result.toString()).toBe('/build/brainstorm');
    });
  });
});
