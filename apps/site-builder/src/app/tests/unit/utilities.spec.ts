import { Observable, of, throwError, firstValueFrom } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { toast } from '@spartan/helm/sonner';
import { LocaleService } from '@invento/shared-util-i18n';
import {
  withMinDuration,
  BuilderState,
  PreviewDataClient,
  ThemeItem,
  InterviewQuestionConfig,
} from '@invento/site-builder-data-access-builder';
import {
  fallbackOnServerError,
  isServerProblem,
  SITE_BUILDER_ENVIRONMENT,
  ApiConfig,
} from '@invento/site-builder-data-access-preview';
import {
  BUSINESS_NAME_CHECKS,
  DOMAIN_SLUG_CHECKS,
  toDomainSlug,
  sanitizeDomainSlug,
  isReservedSlug,
  generateAlgorithmicSuggestions,
  calculateBrandMetrics,
  decodeAnswer,
  encodeAnswer,
  isAnswered,
  toastApiError,
} from '@invento/site-builder-feature-builder';

describe('SiteBuilder Utilities & Helpers', () => {
  describe('withMinDuration', () => {
    it('ensures emission takes at least minDurationMs', async () => {
      const start = Date.now();
      const result = await firstValueFrom(withMinDuration(of('completed'), 100));
      const elapsed = Date.now() - start;

      expect(result).toBe('completed');
      expect(elapsed).toBeGreaterThanOrEqual(80);
    });

    it('propagates errors after minDurationMs', async () => {
      const start = Date.now();
      let caughtError: unknown = null;

      try {
        await firstValueFrom(
          withMinDuration(
            throwError(() => new Error('failed')),
            100,
          ),
        );
      } catch (err) {
        caughtError = err;
      }

      const elapsed = Date.now() - start;
      expect((caughtError as Error).message).toBe('failed');
      expect(elapsed).toBeGreaterThanOrEqual(80);
    });
  });

  describe('businessNameRules', () => {
    describe('BUSINESS_NAME_CHECKS', () => {
      const lengthCheck = BUSINESS_NAME_CHECKS[0];
      const specialCheck = BUSINESS_NAME_CHECKS[1];
      const numberCheck = BUSINESS_NAME_CHECKS[2];

      it('verifies length check (3 to 25 chars)', () => {
        expect(lengthCheck.passes('')).toBe(false);
        expect(lengthCheck.passes('ab')).toBe(false);
        expect(lengthCheck.passes('abc')).toBe(true);
        expect(lengthCheck.passes('1234567890123456789012345')).toBe(true);
        expect(lengthCheck.passes('12345678901234567890123456')).toBe(false);
      });

      it('verifies special character check', () => {
        expect(specialCheck.passes('')).toBe(false);
        expect(specialCheck.passes('My Store$')).toBe(false);
        expect(specialCheck.passes('Brand@123')).toBe(false);
        expect(specialCheck.passes('Clean Store')).toBe(true);
      });

      it('verifies number start check', () => {
        expect(numberCheck.passes('')).toBe(false);
        expect(numberCheck.passes('9Brand')).toBe(false);
        expect(numberCheck.passes('Brand9')).toBe(true);
        expect(numberCheck.passes('Valid Store')).toBe(true);
      });
    });

    describe('DOMAIN_SLUG_CHECKS', () => {
      const lengthCheck = DOMAIN_SLUG_CHECKS[0];
      const charsCheck = DOMAIN_SLUG_CHECKS[1];
      const hyphensCheck = DOMAIN_SLUG_CHECKS[2];

      it('verifies domain slug length (3 to 30 chars)', () => {
        expect(lengthCheck.passes('ab')).toBe(false);
        expect(lengthCheck.passes('abc')).toBe(true);
        expect(lengthCheck.passes('a'.repeat(30))).toBe(true);
        expect(lengthCheck.passes('a'.repeat(31))).toBe(false);
      });

      it('verifies domain slug allowed characters', () => {
        expect(charsCheck.passes('')).toBe(false);
        expect(charsCheck.passes('valid-slug-123')).toBe(true);
        expect(charsCheck.passes('invalid_slug')).toBe(false);
        expect(charsCheck.passes('invalid.slug')).toBe(false);
        expect(charsCheck.passes('invalid slug')).toBe(false);
      });

      it('verifies domain slug hyphen rules', () => {
        expect(hyphensCheck.passes('')).toBe(false);
        expect(hyphensCheck.passes('-invalid')).toBe(false);
        expect(hyphensCheck.passes('invalid-')).toBe(false);
        expect(hyphensCheck.passes('in--valid')).toBe(false);
        expect(hyphensCheck.passes('valid-slug')).toBe(true);
      });
    });

    describe('toDomainSlug & sanitizeDomainSlug', () => {
      it('converts brand name to url-safe domain slug', () => {
        expect(toDomainSlug('My Awesome Store')).toBe('my-awesome-store');
        expect(toDomainSlug('  Brand & Co. (2026)  ')).toBe('brand-co-2026');
        expect(toDomainSlug('multiple   spaces---hyphens')).toBe('multiple-spaces-hyphens');
      });

      it('sanitizes live domain slug input', () => {
        expect(sanitizeDomainSlug('My Store')).toBe('my-store');
        expect(sanitizeDomainSlug('store@domain#name')).toBe('storedomainname');
        expect(sanitizeDomainSlug('my--store')).toBe('my-store');
      });
    });

    describe('isReservedSlug & generateAlgorithmicSuggestions', () => {
      it('identifies reserved system domain slugs', () => {
        expect(isReservedSlug('admin')).toBe(true);
        expect(isReservedSlug('API')).toBe(true);
        expect(isReservedSlug('  dashboard  ')).toBe(true);
        expect(isReservedSlug('inventoai')).toBe(true);
        expect(isReservedSlug('shop')).toBe(true);
        expect(isReservedSlug('my-cool-store')).toBe(false);
      });

      it('generates algorithmic domain suggestions based on business name', () => {
        const suggestions = generateAlgorithmicSuggestions('Nexus');
        expect(suggestions).toEqual([
          'nexus-shop',
          'nexus-store',
          'nexus-official',
          'get-nexus',
          'nexus-online',
        ]);

        const fallback = generateAlgorithmicSuggestions('!@#$');
        expect(fallback[0]).toBe('store-shop');
      });
    });

    describe('calculateBrandMetrics', () => {
      it('returns zero metrics when business name is empty', () => {
        const metrics = calculateBrandMetrics('   ');
        expect(metrics.memorability).toBe(0);
        expect(metrics.brandability).toBe(0);
        expect(metrics.professionalTone).toBe(0);
        expect(metrics.pronunciation).toBe(0);
        expect(metrics.pronunciationGrade).toBe('---');
      });

      it('computes fluent grade and high metrics for concise name without digits', () => {
        const metrics = calculateBrandMetrics('Luminary');
        expect(metrics.pronunciationGrade).toBe('Fluent');
        expect(metrics.brandability).toBeGreaterThan(80);
        expect(metrics.memorability).toBeGreaterThan(80);
        expect(metrics.professionalTone).toBeGreaterThan(85);
      });

      it('computes standard grade for names longer than 8 characters', () => {
        const metrics = calculateBrandMetrics('SuperlativeBrand');
        expect(metrics.pronunciationGrade).toBe('Standard');
        expect(metrics.pronunciation).toBe(88);
      });

      it('applies penalty for names containing digits', () => {
        const withDigits = calculateBrandMetrics('Brand123');
        const withoutDigits = calculateBrandMetrics('BrandX');
        expect(withDigits.brandability).toBeLessThanOrEqual(withoutDigits.brandability);
      });

      it('calculates metrics across various name lengths (short, 4-char, long)', () => {
        const shortName = calculateBrandMetrics('Zen');
        expect(shortName.brandability).toBeGreaterThan(0);

        const fourCharName = calculateBrandMetrics('Nova');
        expect(fourCharName.professionalTone).toBeGreaterThan(0);

        const longName = calculateBrandMetrics('ExtraordinarilyLongBrand');
        expect(longName.pronunciationGrade).toBe('Standard');
      });
    });
  });

  describe('answerCodec', () => {
    const textQuestion: InterviewQuestionConfig = {
      id: 'q1',
      label: 'Store Name',
      type: 'text',
      required: true,
    };

    const singleQuestion: InterviewQuestionConfig = {
      id: 'q2',
      label: 'Personality',
      type: 'single',
      required: true,
      options: ['Minimal', 'Modern', 'Bold', 'Playful'],
    };

    const multiQuestion: InterviewQuestionConfig = {
      id: 'q3',
      label: 'Audience',
      type: 'multi',
      required: true,
      options: ['Gen Z', 'Millennials', 'Professionals', 'Parents'],
    };

    const aiChoiceQuestion: InterviewQuestionConfig = {
      id: 'q4',
      label: 'Style',
      type: 'single',
      required: false,
      options: ['Dark', 'Light', 'Let AI choose'],
    };

    describe('decodeAnswer', () => {
      it('returns empty fallback for null or undefined', () => {
        expect(decodeAnswer(textQuestion, null)).toBe('');
        expect(decodeAnswer(singleQuestion, undefined)).toBe('');
        expect(decodeAnswer(multiQuestion, null)).toEqual([]);
      });

      it('decodes single question by numeric or string index', () => {
        expect(decodeAnswer(singleQuestion, 0)).toBe('Minimal');
        expect(decodeAnswer(singleQuestion, '2')).toBe('Bold');
      });

      it('decodes single question by matching option label', () => {
        expect(decodeAnswer(singleQuestion, 'playful')).toBe('Playful');
        expect(decodeAnswer(singleQuestion, 'Custom Unlisted')).toBe('Custom Unlisted');
      });

      it('decodes multi question from string, array of strings, or indices', () => {
        expect(decodeAnswer(multiQuestion, 'Gen Z, Parents')).toEqual(['Gen Z', 'Parents']);
        expect(decodeAnswer(multiQuestion, [0, 2])).toEqual(['Gen Z', 'Professionals']);
        expect(decodeAnswer(multiQuestion, 'millennials pricing')).toEqual(['Millennials']);
      });

      it('decodes text question preserving value', () => {
        expect(decodeAnswer(textQuestion, 'Acme Store')).toBe('Acme Store');
      });
    });

    describe('encodeAnswer', () => {
      it('encodes text answer trimming whitespace and converting empty to null', () => {
        expect(encodeAnswer(textQuestion, '  Acme  ')).toBe('Acme');
        expect(encodeAnswer(textQuestion, '   ')).toBeNull();
      });

      it('encodes single answer to option index', () => {
        expect(encodeAnswer(singleQuestion, 'Modern')).toBe(1);
        expect(encodeAnswer(singleQuestion, 'Unknown')).toBeNull();
      });

      it('encodes AI choice sentinel as null', () => {
        expect(encodeAnswer(aiChoiceQuestion, 'Let AI choose')).toBeNull();
      });

      it('encodes multi answer to array of indices', () => {
        expect(encodeAnswer(multiQuestion, ['Gen Z', 'Parents'])).toEqual([0, 3]);
        expect(encodeAnswer(multiQuestion, [])).toBeNull();
        expect(encodeAnswer(multiQuestion, ['Gen Z', 'Unrelated'])).toEqual([0]);
      });
    });

    describe('isAnswered', () => {
      it('evaluates whether question has a valid answer', () => {
        expect(isAnswered(textQuestion, '')).toBe(false);
        expect(isAnswered(textQuestion, '   ')).toBe(false);
        expect(isAnswered(textQuestion, null)).toBe(false);
        expect(isAnswered(textQuestion, 'Acme')).toBe(true);

        expect(isAnswered(multiQuestion, [])).toBe(false);
        expect(isAnswered(multiQuestion, ['Gen Z'])).toBe(true);
      });

      it('returns null when encoding unknown question type', () => {
        const unknownQuestion: InterviewQuestionConfig = {
          id: 'q_custom',
          label: 'Custom',
          type: 'unsupported' as never,
          required: false,
        };
        expect(encodeAnswer(unknownQuestion, 'anything')).toBeNull();
      });
    });
  });

  describe('toastApiError', () => {
    const mockLocale = {
      translate: vi.fn((key: string) => `translated_${key}`),
    } as unknown as LocaleService;

    let errorSpy: ReturnType<typeof vi.spyOn>;
    let dismissSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      errorSpy = vi.spyOn(toast, 'error').mockImplementation(() => '');
      dismissSpy = vi.spyOn(toast, 'dismiss').mockImplementation(() => '');
    });

    afterEach(() => {
      errorSpy.mockRestore();
      dismissSpy.mockRestore();
    });

    it('displays multiple errors when error.message is an array', () => {
      const error = {
        error: {
          message: ['First validation failure', 'Second validation failure'],
        },
      };

      toastApiError(error, 'fallback_key', mockLocale, 'toast-123');

      expect(dismissSpy).toHaveBeenCalledWith('toast-123');
      expect(errorSpy).toHaveBeenCalledWith('First validation failure');
      expect(errorSpy).toHaveBeenCalledWith('Second validation failure');
    });

    it('displays single error when error.message is a string', () => {
      const error = {
        error: {
          message: 'Single failure reason',
        },
      };

      toastApiError(error, 'fallback_key', mockLocale, 456);

      expect(errorSpy).toHaveBeenCalledWith('Single failure reason', { id: 456 });
    });

    it('uses plain message property if valid and not an html page', () => {
      const error = {
        message: 'Http failure response',
      };

      toastApiError(error, 'fallback_key', mockLocale);

      expect(errorSpy).toHaveBeenCalledWith('Http failure response', undefined);
    });

    it('falls back to translated key when error is a raw html error page', () => {
      const error = {
        message: '<!DOCTYPE html><html><body>502 Bad Gateway</body></html>',
      };

      toastApiError(error, 'network_error', mockLocale);

      expect(errorSpy).toHaveBeenCalledWith('translated_network_error', undefined);
    });

    it('falls back to translated key when error object is null or empty', () => {
      toastApiError(null, 'generic_error', mockLocale);

      expect(errorSpy).toHaveBeenCalledWith('translated_generic_error', undefined);
    });
  });

  describe('apiFallback', () => {
    describe('isServerProblem', () => {
      it('treats 0, 404, 500, 503, null, and empty as server problems', () => {
        expect(isServerProblem(null)).toBe(true);
        expect(isServerProblem({})).toBe(true);
        expect(isServerProblem({ status: 0 })).toBe(true);
        expect(isServerProblem({ status: 404 })).toBe(true);
        expect(isServerProblem({ status: 500 })).toBe(true);
        expect(isServerProblem({ status: 503 })).toBe(true);
      });

      it('does not treat client errors (400, 401, 403, 409, 422) as server problems', () => {
        expect(isServerProblem({ status: 400 })).toBe(false);
        expect(isServerProblem({ status: 401 })).toBe(false);
        expect(isServerProblem({ status: 403 })).toBe(false);
        expect(isServerProblem({ status: 409 })).toBe(false);
        expect(isServerProblem({ status: 422 })).toBe(false);
      });
    });

    describe('fallbackOnServerError', () => {
      const fallbackValue = { ok: false, isFallback: true };
      const run = (source$: Observable<unknown>) =>
        firstValueFrom(source$.pipe(fallbackOnServerError(() => of(fallbackValue), 'test')));

      beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      });

      it('passes successful observable through without invoking fallback', async () => {
        const result = await run(of({ ok: true, isFallback: false }));
        expect(result).toEqual({ ok: true, isFallback: false });
      });

      it('switches to fallback on server error', async () => {
        const result = await run(throwError(() => ({ status: 500 })));
        expect(result).toEqual(fallbackValue);
      });

      it('rethrows client error without switching to fallback', async () => {
        await expect(
          run(throwError(() => ({ status: 422, message: 'Unprocessable' }))),
        ).rejects.toEqual({
          status: 422,
          message: 'Unprocessable',
        });
      });
    });
  });

  describe('ApiConfig', () => {
    it('resolves development URLs and constructs endpoints', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ApiConfig,
          {
            provide: SITE_BUILDER_ENVIRONMENT,
            useValue: {
              production: false,
              apiUrl: 'http://localhost:3000',
              ssrApiUrl: 'http://localhost:3000',
              dashboardUrl: 'http://localhost:4200',
            },
          },
        ],
      });

      const config = TestBed.inject(ApiConfig);
      expect(config.isProduction).toBe(false);
      expect(config.dashboardUrl).toBe('http://localhost:4400/home');
      expect(config.inventoLoginUrl).toBe('http://localhost:4400/auth/login');
      expect(config.storeBaseUrl).toBe('http://localhost:4300');
      expect(config.url('/api/test')).toContain('/api/test');
      expect(config.url('api/test')).toContain('/api/test');
    });

    it('resolves production URLs and custom login URL', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ApiConfig,
          {
            provide: SITE_BUILDER_ENVIRONMENT,
            useValue: {
              production: true,
              apiUrl: 'https://api.invento.ai',
              inventoLoginUrl: 'https://auth.invento.ai/login',
              inventoDashboardUrl: 'https://dash.invento.ai',
            },
          },
        ],
      });

      const config = TestBed.inject(ApiConfig);
      expect(config.isProduction).toBe(true);
      expect(config.inventoLoginUrl).toBe('https://auth.invento.ai/login');
      expect(config.dashboardUrl).toBe('https://dash.invento.ai');
      expect(config.storeBaseUrl).toBe('https://invento-store.vercel.app');
    });
  });

  describe('PreviewDataClient', () => {
    let client: PreviewDataClient;
    let httpMock: HttpTestingController;
    let builderState: BuilderState;

    const mockTheme: ThemeItem = {
      id: 'theme-123',
      name: 'Modern Minimal',
      description: 'Clean modern aesthetic',
      style: 'default',
      font: 'inter',
      radius: '0.5rem',
      light: { background: '#ffffff', primary: '#000000' },
      dark: { background: '#000000', primary: '#ffffff' },
      isSelected: false,
      css: {
        basePreset: 'default',
        name: 'Modern Minimal',
        description: '',
        rawCss: '',
      },
    };

    beforeEach(() => {
      TestBed.resetTestingModule();
      sessionStorage.clear();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          PreviewDataClient,
          BuilderState,
          {
            provide: SITE_BUILDER_ENVIRONMENT,
            useValue: {
              production: false,
              apiUrl: 'http://localhost:3000',
              dashboardUrl: 'http://localhost:4200',
            },
          },
        ],
      });

      client = TestBed.inject(PreviewDataClient);
      httpMock = TestBed.inject(HttpTestingController);
      builderState = TestBed.inject(BuilderState);

      httpMock
        .match((req) => req.url.includes('/site-builder/questions'))
        .forEach((req) => req.flush({ questions: [] }));
    });

    afterEach(() => {
      httpMock.verify();
      TestBed.resetTestingModule();
    });

    it('loads themes from api and caches them on builderState', () => {
      client.loadThemes();
      expect(client.isLoading()).toBe(true);

      const req = httpMock.expectOne((r) => r.url.includes('/site-builder/themes'));
      expect(req.request.method).toBe('GET');
      req.flush({ themes: [mockTheme] });

      expect(client.isLoading()).toBe(false);
      expect(client.themeSuggestions()[0].id).toBe('theme-123');
      expect(client.themeSuggestions()[0].name).toBe('Modern Minimal');
      expect(client.themesUnavailable()).toBe(false);
      expect(builderState.themes()).toEqual([mockTheme]);
    });

    it('reuses cached themes from builderState without hitting network', () => {
      builderState.themes.set([mockTheme]);

      client.loadThemes();

      httpMock.expectNone((r) => r.url.includes('/site-builder/themes'));
      expect(client.themeSuggestions()[0].id).toBe('theme-123');
      expect(client.themesUnavailable()).toBe(false);
    });

    it('sets themesUnavailable and themeError on server failure', () => {
      client.loadThemes();

      const req = httpMock.expectOne((r) => r.url.includes('/site-builder/themes'));
      req.flush('Error loading themes', { status: 500, statusText: 'Server Error' });

      expect(client.isLoading()).toBe(false);
      expect(client.themesUnavailable()).toBe(true);
      expect(client.themeError()).toBeTruthy();
      expect(client.themeSuggestions()).toEqual([]);
    });

    it('handles empty themes array response', () => {
      client.loadThemes();

      httpMock.expectOne((r) => r.url.includes('/site-builder/themes')).flush({ themes: [] });

      expect(client.themesUnavailable()).toBe(true);
      expect(client.themeSuggestions()).toEqual([]);
    });

    it('reload refetches themes after failure', () => {
      client.loadThemes();
      httpMock
        .expectOne((r) => r.url.includes('/site-builder/themes'))
        .flush('Error', { status: 500, statusText: 'Error' });
      expect(client.themesUnavailable()).toBe(true);

      client.reload();
      httpMock
        .expectOne((r) => r.url.includes('/site-builder/themes'))
        .flush({ themes: [mockTheme] });

      expect(client.themesUnavailable()).toBe(false);
      expect(client.themeSuggestions()[0].id).toBe('theme-123');
    });

    it('invalidate resets loaded state so subsequent loadThemes calls network', () => {
      client.loadThemes();
      httpMock
        .expectOne((r) => r.url.includes('/site-builder/themes'))
        .flush({ themes: [mockTheme] });

      builderState.themes.set([]);
      client.invalidate();
      client.loadThemes();

      httpMock
        .expectOne((r) => r.url.includes('/site-builder/themes'))
        .flush({ themes: [mockTheme] });
    });
  });
});
