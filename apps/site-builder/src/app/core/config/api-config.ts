import { Injectable } from '@angular/core';
import { environment } from '@/environments/environment.example';

declare const process: { env?: Record<string, string | undefined> };

/**
 * Single source of truth for where the API lives and how we authenticate to it.
 *
 * Every value is resolved once, through the same ordered chain:
 *   environment.* -> process.env -> window.* -> window.__ENV__ -> globalThis.*
 *
 * The chain exists because this app is built once and deployed to environments
 * that inject config differently (SSR reads process.env; static hosts inject a
 * `window.__ENV__` blob at runtime).
 */
@Injectable({ providedIn: 'root' })
export class ApiConfig {
  /** Base URL with any trailing slashes stripped. Empty string means "use relative paths". */
  readonly baseUrl = this.resolveBaseUrl();
  // readonly apiKey = this.resolve('API_KEY', 'INVENTO_API_KEY', environment.apiKey);
  readonly dashboardUrl = this.resolveDashboardUrl();
  readonly googleClientId = this.resolve(
    'GOOGLE_CLIENT_ID',
    'INVENTO_GOOGLE_CLIENT_ID',
    environment.googleClientId || '',
  );

  /**
   * Builds a full endpoint URL. Pass a leading-slash path, e.g. '/site-builder/publish'.
   * When `baseUrl` is empty the path is returned as-is so it resolves against the
   * current origin (and therefore through the dev proxy).
   */
  url(path: string): string {
    const suffix = path.startsWith('/') ? path : `/${path}`;
    return this.baseUrl ? `${this.baseUrl}${suffix}` : suffix;
  }

  private resolveBaseUrl(): string {
    // In local dev every request goes through the dev-server proxy
    // (see proxy.conf.json), so requests must stay relative to this origin.
    // This deliberately makes environment.apiUrl a no-op on localhost.
    if (this.isLocalhost()) return '';
    return this.resolve('API_URL', 'INVENTO_API_URL', environment.apiUrl).replace(/\/+$/, '');
  }

  private resolveDashboardUrl(): string {
    const configured = this.resolve(
      'INVENTO_DASHBOARD_URL',
      'INVENTO_DASHBOARD_URL',
      environment.inventoDashboardUrl,
    );
    if (configured) return configured;
    return environment.production
      ? 'https://invento-ai.vercel.app/home'
      : 'http://localhost:4400/home';
  }

  private isLocalhost(): boolean {
    return typeof window !== 'undefined' && window.location?.hostname === 'localhost';
  }

  /** Walks the config chain for a value, preferring the compiled-in environment. */
  private resolve(key: string, altKey: string, fromEnvironment: string): string {
    if (fromEnvironment) return fromEnvironment;

    if (typeof process !== 'undefined') {
      const fromProcess = process.env?.[key] || process.env?.[altKey];
      if (fromProcess) return fromProcess;
    }

    if (typeof window !== 'undefined') {
      const w = window as unknown as Record<string, unknown>;
      for (const k of [key, altKey]) {
        if (typeof w[k] === 'string' && w[k]) return w[k] as string;
      }
      const injected = w['__ENV__'] as Record<string, string> | undefined;
      if (injected?.[key]) return injected[key];
      if (injected?.[altKey]) return injected[altKey];
    }

    const g = globalThis as unknown as Record<string, unknown>;
    return (g[key] as string) || (g[altKey] as string) || '';
  }
}
