import { TestBed } from '@angular/core/testing';
import { Route } from '@angular/router';
import { routes } from '../../app.routes';
import { appConfig } from '../../app.config';
import { builderRoutes } from '@invento/site-builder-feature-builder';
import { homeRoutes } from '@invento/site-builder-feature-home';
import { BuilderState } from '@invento/site-builder-data-access-builder';
import { AUTH_CONFIG, AuthConfig, AuthService } from '@invento/shared-data-access-auth';
import { TRANSLATION_LOADER } from '@invento/shared-util-i18n';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { environment as prodEnvironment } from '../../../environments/environment';
import { environment as devEnvironment } from '../../../environments/environment.development';
import { config as serverConfig } from '../../app.config.server';
import { serverRoutes } from '../../app.routes.server';
import { RenderMode } from '@angular/ssr';

describe('App Routes and Configuration', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    sessionStorage.clear();
  });

  describe('Application Routes (app.routes.ts)', () => {
    it('defines primary root layout route structure', () => {
      expect(routes.length).toBeGreaterThan(0);
      const rootRoute = routes.find((r) => r.path === '');
      expect(rootRoute).toBeDefined();
      if (rootRoute && rootRoute.children) {
        expect(rootRoute.children.length).toBe(2);
      }
    });

    it('loads lazy child routes successfully', async () => {
      const rootRoute = routes.find((r) => r.path === '');
      if (rootRoute && rootRoute.children) {
        const homeChild = rootRoute.children[0];
        if (homeChild && typeof homeChild.loadChildren === 'function') {
          const loadedHome = await (homeChild.loadChildren as () => Promise<Route[]>)();
          expect(loadedHome).toBeDefined();
        }

        const buildChild = rootRoute.children[1];
        if (buildChild && buildChild.children) {
          const builderGrandChild = buildChild.children[0];
          if (builderGrandChild && typeof builderGrandChild.loadChildren === 'function') {
            const loadedBuilder = await (
              builderGrandChild.loadChildren as () => Promise<Route[]>
            )();
            expect(loadedBuilder).toBeDefined();
          }
        }
      }
    });

    it('loads auth lazy routes successfully', async () => {
      const ssoRoute = routes.find((r) => r.path === 'auth/sso');
      expect(ssoRoute).toBeDefined();
      if (ssoRoute && typeof ssoRoute.loadChildren === 'function') {
        const loadedSso = await (ssoRoute.loadChildren as () => Promise<Route[]>)();
        expect(loadedSso).toBeDefined();
      }

      const authRoute = routes.find((r) => r.path === 'auth');
      expect(authRoute).toBeDefined();
      if (authRoute && authRoute.children) {
        for (const child of authRoute.children) {
          if (typeof child.loadChildren === 'function') {
            const loadedAuthChild = await (child.loadChildren as () => Promise<Route[]>)();
            expect(loadedAuthChild).toBeDefined();
          }
        }
      }
    });

    it('defines wildcard fallback route', () => {
      const wildcard = routes.find((r) => r.path === '**');
      expect(wildcard).toBeDefined();
      if (wildcard) {
        expect(wildcard.redirectTo).toBe('home');
      }
    });
  });

  describe('Builder Sub-Routes (builder.routes.ts)', () => {
    it('defines 4 wizard steps and resolves their component loaders', async () => {
      const stepPaths = ['brainstorm', 'ai-interview', 'validation', 'preview'];

      for (const path of stepPaths) {
        const stepRoute = builderRoutes.find((r) => r.path === path);
        expect(stepRoute).toBeDefined();
        if (stepRoute && typeof stepRoute.loadComponent === 'function') {
          const comp = await (stepRoute.loadComponent as () => Promise<unknown>)();
          expect(comp).toBeDefined();
        }
      }
    });

    it('defines root resume guard and wildcard fallback in builderRoutes', () => {
      const rootStep = builderRoutes.find((r) => r.path === '' && r.pathMatch === 'full');
      expect(rootStep).toBeDefined();

      const wildcard = builderRoutes.find((r) => r.path === '**');
      expect(wildcard).toBeDefined();
      if (wildcard) {
        expect(wildcard.redirectTo).toBe('');
      }
    });
  });

  describe('Home Routes (home.routes.ts)', () => {
    it('resolves home routes component loaders', async () => {
      for (const route of homeRoutes) {
        if (typeof route.loadComponent === 'function') {
          const comp = await (route.loadComponent as () => Promise<unknown>)();
          expect(comp).toBeDefined();
        }
      }
    });
  });

  describe('Application Config & Providers (app.config.ts)', () => {
    it('provides application configuration with all mandatory providers', () => {
      expect(appConfig.providers).toBeDefined();
      expect(appConfig.providers.length).toBeGreaterThan(5);
    });

    it('constructs and validates AuthConfig factory behavior', () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [...appConfig.providers, BuilderState],
      });

      const authConfig = TestBed.inject(AUTH_CONFIG) as AuthConfig;
      const builderState = TestBed.inject(BuilderState);

      expect(authConfig).toBeDefined();
      expect(authConfig.postLoginRoute).toBe('/build');
      expect(authConfig.tokenStorageKey).toBe('invento');
      expect(authConfig.authRole).toBe('owner');

      if (authConfig.resolvePostAuthRoute) {
        const dummyAuthServiceWithStore = {
          getStoreSlug: () => 'my-store',
        } as unknown as AuthService;
        expect(authConfig.resolvePostAuthRoute(dummyAuthServiceWithStore, '/build')).toBe('/home');

        const dummyAuthServiceWithoutStore = {
          getStoreSlug: () => null,
        } as unknown as AuthService;
        expect(authConfig.resolvePostAuthRoute(dummyAuthServiceWithoutStore, '/build')).toBe(
          '/build',
        );
      }

      if (authConfig.onAuthEvent) {
        const resetSpy = vi.spyOn(builderState, 'reset');
        const loadQuestionsSpy = vi.spyOn(builderState, 'loadQuestions');

        authConfig.onAuthEvent('login');
        expect(resetSpy).toHaveBeenCalled();
        expect(loadQuestionsSpy).toHaveBeenCalled();

        resetSpy.mockClear();
        loadQuestionsSpy.mockClear();

        authConfig.onAuthEvent('logout');
        expect(resetSpy).toHaveBeenCalled();
        expect(loadQuestionsSpy).not.toHaveBeenCalled();
      }
    });

    it('evaluates translation loader for Arabic and English locales', () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [...appConfig.providers, BuilderState],
      });

      const translationLoader = TestBed.inject(TRANSLATION_LOADER);
      expect(typeof translationLoader).toBe('function');

      const arTranslations = translationLoader('ar');
      const enTranslations = translationLoader('en');

      expect(arTranslations).toBeDefined();
      expect(enTranslations).toBeDefined();
    });
  });

  describe('Environment Configurations', () => {
    it('verifies environment variables definition', () => {
      expect(typeof prodEnvironment.production).toBe('boolean');
      expect(prodEnvironment.apiUrl).toBeDefined();
      expect(prodEnvironment.ssrApiUrl).toBeDefined();
      expect(prodEnvironment.inventoDashboardUrl).toBeDefined();
    });

    it('verifies development environment variables', () => {
      expect(devEnvironment.production).toBe(false);
      expect(devEnvironment.apiUrl).toBeDefined();
      expect(devEnvironment.ssrApiUrl).toBeDefined();
      expect(devEnvironment.inventoDashboardUrl).toBeDefined();
    });
  });

  describe('Server Configuration and Routing (app.config.server.ts & app.routes.server.ts)', () => {
    it('provides merged server application configuration', () => {
      expect(serverConfig).toBeDefined();
      expect(serverConfig.providers).toBeDefined();
      expect(serverConfig.providers.length).toBeGreaterThan(0);
    });

    it('defines server prerender routes configuration', () => {
      expect(serverRoutes).toBeDefined();
      expect(Array.isArray(serverRoutes)).toBe(true);
      expect(serverRoutes.length).toBe(1);
      expect(serverRoutes[0].path).toBe('**');
      expect(serverRoutes[0].renderMode).toBe(RenderMode.Prerender);
    });
  });
});
