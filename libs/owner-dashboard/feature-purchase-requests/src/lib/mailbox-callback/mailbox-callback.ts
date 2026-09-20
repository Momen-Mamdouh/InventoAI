import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { HlmSpinner } from '@spartan/helm/spinner';
import { HlmCard } from '@spartan/helm/card';
import { HlmButton } from '@spartan/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAlertCircle, lucideCheckCircle2, lucideLoader2 } from '@ng-icons/lucide';
import { PurchaseRequestService } from '@invento/owner-dashboard-data-access-purchase-request';
import { HlmH1 } from '@spartan/helm/typography';

@Component({
  selector: 'app-mailbox-callback',
  imports: [HlmSpinner, NgIcon, HlmCard, HlmButton, HlmH1, TranslatePipe],
  providers: [provideIcons({ lucideAlertCircle, lucideCheckCircle2, lucideLoader2 })],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 bg-background">
      <div hlmCard class="w-full max-w-md p-8 text-center shadow-sm">
        @if (loading()) {
          <hlm-spinner class="text-[30px] text-primary mx-auto" />
          <h1 hlmH1 class="mt-4">{{ 'purchase_requests.mailbox_connecting_title' | translate }}</h1>
          <p class="text-sm text-muted-foreground mt-2">
            {{ 'purchase_requests.mailbox_connecting_desc' | translate }}
          </p>
        } @else if (success()) {
          <ng-icon name="lucideCheckCircle2" size="28" class="text-emerald-600 mx-auto" />
          <h1 hlmH1 class="mt-4">{{ 'purchase_requests.mailbox_connected_title' | translate }}</h1>
          <p class="text-sm text-muted-foreground mt-2">
            {{ 'purchase_requests.mailbox_connected_desc' | translate }}
          </p>
        } @else {
          <ng-icon name="lucideAlertCircle" size="28" class="text-destructive mx-auto" />
          <h1 hlmH1 class="mt-4">{{ 'purchase_requests.mailbox_error_title' | translate }}</h1>
          <p class="text-sm text-muted-foreground mt-2">{{ error() }}</p>
          <button
            hlmBtn
            class="mt-5 min-h-11 px-4"
            (click)="router.navigate(['/purchase-requests'])"
          >
            {{ 'purchase_requests.mailbox_btn_back' | translate }}
          </button>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MailboxCallback implements OnInit {
  readonly router = inject(Router);
  private readonly api = inject(PurchaseRequestService);
  private readonly localeService = inject(LocaleService);

  readonly loading = signal(true);
  readonly success = signal(false);
  readonly error = signal(this.localeService.translate('purchase_requests.mailbox_err_incomplete'));

  ngOnInit(): void {
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const storedState =
      typeof window === 'undefined' ? null : sessionStorage.getItem('invento_mailbox_state');

    if (!code || !state || (storedState && storedState !== state)) {
      this.loading.set(false);
      this.error.set(this.localeService.translate('purchase_requests.mailbox_err_expired'));
      return;
    }

    this.api.finishMailbox(code, state).subscribe({
      next: () => {
        if (typeof window !== 'undefined') sessionStorage.removeItem('invento_mailbox_state');
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/purchase-requests']), 900);
      },
      error: (err: { error?: { message?: string | string[] } }) => {
        this.loading.set(false);
        this.error.set(
          Array.isArray(err?.error?.message)
            ? err.error.message.join(', ')
            : err?.error?.message ||
                this.localeService.translate('purchase_requests.mailbox_err_rejected'),
        );
      },
    });
  }
}
