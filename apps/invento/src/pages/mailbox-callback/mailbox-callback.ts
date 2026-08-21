import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAlertCircle, lucideCheckCircle2, lucideLoader2 } from '@ng-icons/lucide';
import { PurchaseRequestService } from '@invento/invento/features/purchase-requests';

@Component({
  selector: 'app-mailbox-callback',
  imports: [NgIcon],
  providers: [provideIcons({ lucideAlertCircle, lucideCheckCircle2, lucideLoader2 })],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 bg-background">
      <div
        class="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm"
      >
        @if (loading()) {
          <ng-icon name="lucideLoader2" size="30" class="animate-spin text-primary mx-auto" />
          <h1 class="text-xl font-bold mt-4">Connecting mailbox…</h1>
          <p class="text-sm text-muted-foreground mt-2">
            Finishing the Google connection securely.
          </p>
        } @else if (success()) {
          <ng-icon name="lucideCheckCircle2" size="30" class="text-emerald-600 mx-auto" />
          <h1 class="text-xl font-bold mt-4">Mailbox connected</h1>
          <p class="text-sm text-muted-foreground mt-2">Automatic supplier replies are ready.</p>
        } @else {
          <ng-icon name="lucideAlertCircle" size="30" class="text-destructive mx-auto" />
          <h1 class="text-xl font-bold mt-4">Could not connect mailbox</h1>
          <p class="text-sm text-muted-foreground mt-2">{{ error() }}</p>
          <button
            class="mt-5 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
            (click)="router.navigate(['/purchase-requests'])"
          >
            Back to purchase requests
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
  readonly loading = signal(true);
  readonly success = signal(false);
  readonly error = signal('The authorization response was incomplete.');

  ngOnInit(): void {
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const storedState =
      typeof window === 'undefined' ? null : sessionStorage.getItem('invento_mailbox_state');

    if (!code || !state || (storedState && storedState !== state)) {
      this.loading.set(false);
      this.error.set('The connection attempt expired or does not match. Please start again.');
      return;
    }

    this.api.finishMailbox(code, state).subscribe({
      next: () => {
        if (typeof window !== 'undefined') sessionStorage.removeItem('invento_mailbox_state');
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/purchase-requests']), 900);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          Array.isArray(err?.error?.message)
            ? err.error.message.join(', ')
            : err?.error?.message ||
                'Google did not accept this authorization. Please try connecting again.',
        );
      },
    });
  }
}
