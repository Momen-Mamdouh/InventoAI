import { Injectable, inject, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { ApiConfig } from '../config/api-config';

interface GoogleIdCredentialResponse {
  credential: string;
}

interface GoogleIdInitOptions {
  client_id: string;
  callback: (response: GoogleIdCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleIdRenderButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number | string;
  [key: string]: unknown;
}

interface GoogleAccountsId {
  initialize(options: GoogleIdInitOptions): void;
  prompt(listener?: (notification: unknown) => void): void;
  renderButton(parent: HTMLElement, options: GoogleIdRenderButtonOptions): void;
}

interface GoogleNamespace {
  accounts?: {
    id?: GoogleAccountsId;
  };
}

declare const google: GoogleNamespace | undefined;

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private ngZone = inject(NgZone);
  private apiConfig = inject(ApiConfig);
  private credential$ = new Subject<string>();
  private isInitialized = false;

  get idToken$(): Observable<string> {
    return this.credential$.asObservable();
  }

  getClientId(): string {
    return this.apiConfig.googleClientId || '';
  }

  hasClientId(): boolean {
    return Boolean(this.getClientId());
  }

  loadScript(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    if (typeof google !== 'undefined' && google.accounts?.id) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.getElementById('google-gsi-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', (err) => reject(err));
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  async initialize(customCallback?: (idToken: string) => void): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      await this.loadScript();

      const clientId = this.getClientId();
      if (!clientId) {
        return false;
      }

      if (typeof google !== 'undefined' && google.accounts?.id) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential: string }) => {
            this.ngZone.run(() => {
              if (response?.credential) {
                this.credential$.next(response.credential);
                if (customCallback) {
                  customCallback(response.credential);
                }
              }
            });
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        this.isInitialized = true;
        return true;
      }
    } catch (err) {
      console.warn('Google Auth initialization warning:', err);
    }

    return false;
  }

  prompt(): void {
    try {
      if (typeof google !== 'undefined' && google.accounts?.id) {
        google.accounts.id.prompt(() => {
          // Captures One Tap notification status if needed
        });
      }
    } catch (err) {
      console.warn('Google Auth prompt warning:', err);
    }
  }

  renderButton(element: HTMLElement, options: Record<string, unknown> = {}): void {
    try {
      if (typeof google !== 'undefined' && google.accounts?.id && element) {
        google.accounts.id.renderButton(element, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          ...options,
        });
      }
    } catch (err) {
      console.warn('Google Auth renderButton warning:', err);
    }
  }
}
