import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCreditCard, lucidePlus, lucideTrash2 } from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan/helm/badge';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmSeparatorImports } from '@spartan/helm/separator';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { TranslatePipe } from '@invento/core';

interface PaymentCard {
  id: number;
  brand: string;
  last4: string;
  holderName: string;
  expiry: string;
  isDefault: boolean;
}

/**
 * NOT WIRED UP.
 *
 * The backend exposes no payment-method endpoint of any kind (verified against
 * BACKEND/src/users — there is no card/billing controller, service, or DTO anywhere in the API).
 * This component has nothing to load and nothing to save to, so it is intentionally left out of
 * `account-settings.routes.ts` and unlinked from the account-settings sidebar. It is kept here,
 * unrouted, only as a starting point for whoever builds the real payment-method feature once a
 * backend endpoint exists. All local state below is empty scaffolding, not real data.
 */
@Component({
  selector: 'app-account-settings-billing',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIcon,
    HlmButtonImports,
    HlmCardImports,
    HlmInputImports,
    HlmLabelImports,
    HlmBadgeImports,
    HlmSeparatorImports,
    HlmTypographyImports,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucideCreditCard, lucidePlus, lucideCheck, lucideTrash2 })],
  templateUrl: './account-settings-billing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsBillingComponent {
  private readonly fb = inject(FormBuilder);

  readonly showForm = signal(false);
  readonly cards = signal<PaymentCard[]>([]);

  readonly form = this.fb.nonNullable.group({
    cardName: ['', Validators.required],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)]],
    expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvc: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    zip: ['', Validators.required],
  });

  toggleForm() {
    this.showForm.set(!this.showForm());
    if (!this.showForm()) {
      this.form.reset();
    }
  }

  saveCard() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const expiry = raw.expiry;
    const cardNumber = raw.cardNumber.replace(/\s+/g, '');
    const last4 = cardNumber.slice(-4);
    const brand = this.getBrandFromNumber(cardNumber);

    const nextCard: PaymentCard = {
      id: Date.now(),
      brand,
      last4,
      holderName: raw.cardName,
      expiry,
      isDefault: this.cards().length === 0,
    };

    this.cards.set([...this.cards(), nextCard]);
    this.showForm.set(false);
    this.form.reset();
  }

  setDefaultCard(cardId: number) {
    this.cards.set(this.cards().map((card) => ({ ...card, isDefault: card.id === cardId })));
  }

  removeCard(cardId: number) {
    const currentCards = this.cards();
    const target = currentCards.find((card) => card.id === cardId);
    if (!target) return;

    const remaining = currentCards.filter((card) => card.id !== cardId);
    if (target.isDefault && remaining.length > 0) {
      remaining[0].isDefault = true;
    }

    this.cards.set(remaining);
  }

  private getBrandFromNumber(number: string) {
    if (number.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'Amex';
    return 'Card';
  }
}
