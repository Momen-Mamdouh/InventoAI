import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  effect,
  OnInit,
  viewChildren,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import gsap from 'gsap';
import { LocaleService, TranslatePipe } from '@invento/core';

// Spartan UI & Icons
import { HlmLabel } from '@spartan/helm/label';
import { HlmInput } from '@spartan/helm/input';
import { HlmButton } from '@spartan/helm/button';
import { HlmTextareaImports } from '@spartan/helm/textarea';
import { EmptyState } from '@invento/shared';
import { HlmCard } from '@spartan/helm/card';
import { HlmDialogImports } from '@spartan/helm/dialog';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import {
  lucideShoppingCart,
  lucideShieldCheck,
  lucideTruck,
  lucideArrowLeft,
  lucideTrash2,
  lucideLoader2,
  lucideInfo,
  lucideCheckCircle,
  lucideAlertTriangle,
} from '@ng-icons/lucide';
import { toast } from '@spartan/helm/sonner';

import { CartService } from '@invento/user-site/app/core/service/cart.service';
import { AuthService } from '@invento/user-site/app/core/service/auth.service';
import { OrdersDataService, type OrderDetail } from '@invento/user-site/app/features/orders';
import { extractErrorMessage } from '@invento/shared-util-error';
import type { CreateOrderPayload } from '@invento/user-site/app/core/interface/cart.interface';
import { StoreSlugService } from '@invento/user-site/app/core/service/store-slug.service';
import { animateElementsOnRender } from '@invento/user-site/app/core/utils/animation.utils';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    RouterLink,
    HlmLabel,
    HlmInput,
    HlmButton,
    HlmCard,
    HlmTextareaImports,
    HlmDialogImports,
    BrnDialogContent,
    HlmTypographyImports,
    EmptyState,
    NgIconComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      lucideShoppingCart,
      lucideShieldCheck,
      lucideTruck,
      lucideArrowLeft,
      lucideTrash2,
      lucideLoader2,
      lucideInfo,
      lucideCheckCircle,
      lucideAlertTriangle,
    }),
  ],
  templateUrl: './checkout.html',
})
export class CheckoutComponent implements OnInit {
  /** Resolved from the URL/host, never a build-time constant. */
  private readonly resolvedStoreSlug = inject(StoreSlugService).slug;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly locale = inject(LocaleService);
  protected readonly cartService = inject(CartService);
  protected readonly authService = inject(AuthService);
  protected readonly ordersService = inject(OrdersDataService);

  // Cart signals
  readonly cartItems = this.cartService.items;
  readonly currency = this.cartService.currency;
  readonly subtotalAmount = this.cartService.subtotalAmount;
  readonly shippingFee = this.cartService.shippingFee;
  readonly totalAmount = this.cartService.totalAmount;

  // UI state
  readonly isSubmitting = signal<boolean>(false);
  readonly isClearCartModalOpen = signal<boolean>(false);
  readonly activeStoreSlug = signal<string>(this.resolvedStoreSlug());

  readonly checkoutForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    contactPhone: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(32)]],
    line1: ['', [Validators.required, Validators.maxLength(200)]],
    line2: ['', [Validators.maxLength(200)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    governorate: ['', [Validators.maxLength(100)]],
    postalCode: ['', [Validators.maxLength(20)]],
    country: ['EG', [Validators.required, Validators.maxLength(2)]],
    customerNote: ['', [Validators.maxLength(500)]],
    paymentMethod: ['cod', [Validators.required]],
  });

  /**
   * Scoped view queries instead of `document.querySelectorAll`.
   *
   * The global lookups matched `.fade-in-left`/`.fade-in-right` anywhere in the document, so
   * they could pick up elements belonging to another component; these resolve only within
   * this template.
   */
  private readonly fadeInLeftItems = viewChildren<ElementRef<HTMLElement>>('fadeInLeft');
  private readonly fadeInRightItems = viewChildren<ElementRef<HTMLElement>>('fadeInRight');

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      const isAuth = this.authService.isAuthenticated();

      if (isAuth) {
        this.checkoutForm.get('email')?.disable();
      } else {
        this.checkoutForm.get('email')?.enable();
      }

      if (user) {
        const patch: Record<string, string> = {};
        if (user.firstName) {
          patch['firstName'] = user.firstName;
        }
        if (user.lastName) {
          patch['lastName'] = user.lastName;
        }
        if (user.email) {
          patch['email'] = user.email;
        }
        if (Object.keys(patch).length > 0) {
          this.checkoutForm.patchValue(patch);
        }
      }
    });

    /**
     * `afterRenderEffect` (via `animateElementsOnRender`), not `afterNextRender`.
     *
     * The previous `afterNextRender` + `document.querySelectorAll` pair fired once with no
     * cleanup, so both tweens leaked when this component was destroyed.
     * `animateElementsOnRender` disposes each via `onCleanup`.
     *
     * The original built one `gsap.timeline()` so the right column could start 0.4s before
     * the left column's 0.6s entrance finished; splitting them into two independent
     * `animateElementsOnRender` calls reproduces the same overlap with an explicit
     * `delay: 0.2` on the right tween (0.6 - 0.4 = 0.2), since both columns are always
     * present together and never animate without each other in practice.
     *
     * RTL: `x: -30`/`x: 30` are physical directions, so the entrance slid in from the wrong
     * side in Arabic. `LocaleService.isRtl` mirrors the sign so the left column still enters
     * from its (now right-hand) leading edge.
     */
    animateElementsOnRender(this.fadeInLeftItems, (items) =>
      gsap.from(items, {
        x: this.locale.isRtl() ? 30 : -30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
      }),
    );

    animateElementsOnRender(this.fadeInRightItems, (items) =>
      gsap.from(items, {
        x: this.locale.isRtl() ? -30 : 30,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: 'power3.out',
      }),
    );
  }

  ngOnInit(): void {
    // Resolve store slug
    const paramSlug =
      this.route.snapshot.paramMap.get('storeSlug') ||
      this.route.parent?.snapshot.paramMap.get('storeSlug');
    if (paramSlug) {
      this.activeStoreSlug.set(paramSlug);
    }

    const storeSlug = this.activeStoreSlug();

    // Prefill customer & shipping details
    this.prefillForm();

    // If authenticated, fetch previous orders to auto-populate phone and address if not already set
    if (this.authService.isAuthenticated()) {
      this.ordersService.getMyOrders(storeSlug, 1, 5).subscribe({
        next: (res) => {
          if (res.items && res.items.length > 0) {
            const first = res.items[0];
            this.ordersService.getMyOrder(storeSlug, first.orderNumber).subscribe({
              next: (detail) => {
                this.applyOrderFallback(detail);
              },
            });
          }
        },
      });
    }
  }

  private applyOrderFallback(detail: OrderDetail): void {
    const patch: Record<string, string> = {};
    const currentVal = this.checkoutForm.getRawValue();

    if (!currentVal.firstName && !currentVal.lastName && detail.contactName) {
      const parts = detail.contactName.trim().split(' ');
      patch['firstName'] = parts[0] || '';
      patch['lastName'] = parts.slice(1).join(' ') || '';
    }
    if (!currentVal.contactPhone && detail.contactPhone) {
      patch['contactPhone'] = detail.contactPhone;
    }
    if (!currentVal.line1 && detail.shippingAddress?.line1) {
      patch['line1'] = detail.shippingAddress.line1;
    }
    if (!currentVal.line2 && detail.shippingAddress?.line2) {
      patch['line2'] = detail.shippingAddress.line2;
    }
    if (!currentVal.city && detail.shippingAddress?.city) {
      patch['city'] = detail.shippingAddress.city;
    }
    if (!currentVal.governorate && detail.shippingAddress?.governorate) {
      patch['governorate'] = detail.shippingAddress.governorate;
    }
    if (!currentVal.postalCode && detail.shippingAddress?.postalCode) {
      patch['postalCode'] = detail.shippingAddress.postalCode;
    }
    if (detail.shippingAddress?.country) {
      patch['country'] = detail.shippingAddress.country.toUpperCase();
    }
    if (!currentVal.email && detail.contactEmail) {
      patch['email'] = detail.contactEmail;
    }

    if (Object.keys(patch).length > 0) {
      this.checkoutForm.patchValue(patch);
    }
  }

  private prefillForm(): void {
    const isAuth = this.authService.isAuthenticated();
    const prefill = this.cartService.prefilledCustomer();
    const currentUser = this.authService.currentUser();

    let firstName =
      (isAuth && currentUser?.firstName ? currentUser.firstName : '') ||
      currentUser?.firstName ||
      prefill?.firstName ||
      '';
    let lastName =
      (isAuth && currentUser?.lastName ? currentUser.lastName : '') ||
      currentUser?.lastName ||
      prefill?.lastName ||
      '';

    if (!firstName && !lastName && prefill?.contactName) {
      const parts = prefill.contactName.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    const email =
      (isAuth && currentUser?.email ? currentUser.email : '') ||
      currentUser?.email ||
      prefill?.contactEmail ||
      '';

    // If still missing firstName, derive from email handle
    if (!firstName && email) {
      const handle = email.split('@')[0];
      const parts = handle.split(/[._-]/);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        lastName = parts
          .slice(1)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(' ');
      } else if (parts.length === 1 && parts[0]) {
        firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
    }

    let phone = prefill?.contactPhone || '';
    let address = prefill?.shippingAddress;

    // If address or phone is not yet present in prefill, check last placed order
    const lastOrder = this.cartService.lastPlacedOrder();
    if (!phone && lastOrder?.contactPhone) {
      phone = lastOrder.contactPhone;
    }
    if (!address && lastOrder?.shippingAddress) {
      address = lastOrder.shippingAddress;
    }

    if (isAuth) {
      this.checkoutForm.get('email')?.disable();
    } else {
      this.checkoutForm.get('email')?.enable();
    }

    this.checkoutForm.patchValue({
      firstName,
      lastName,
      email,
      contactPhone: phone,
      line1: address?.line1 || '',
      line2: address?.line2 || '',
      city: address?.city || '',
      governorate: address?.governorate || '',
      postalCode: address?.postalCode || '',
      country: (address?.country || 'EG').toUpperCase(),
      customerNote: prefill?.customerNote || '',
      paymentMethod: 'cod',
    });
  }

  updateQuantity(index: number, delta: number): void {
    this.cartService.updateQuantity(index, delta);
  }

  removeItem(index: number): void {
    this.cartService.removeItem(index);
  }

  openClearCartModal(): void {
    this.isClearCartModalOpen.set(true);
  }
  protected onClearCartDialogState(state: 'open' | 'closed'): void {
    if (state === 'closed') this.closeClearCartModal();
  }

  closeClearCartModal(): void {
    this.isClearCartModalOpen.set(false);
  }

  confirmClearCart(): void {
    this.cartService.clearCart();
    this.closeClearCartModal();
    toast.info(this.locale.translate('checkout.toast.cart_cleared'));
  }

  onGuestProceedToLogin(): void {
    if (this.cartItems().length === 0) {
      toast.warning(this.locale.translate('checkout.toast.cart_empty'));
      return;
    }

    const formVal = this.checkoutForm.getRawValue();
    this.cartService.setPrefilledCustomer({
      firstName: formVal.firstName || undefined,
      lastName: formVal.lastName || undefined,
      contactName: `${formVal.firstName || ''} ${formVal.lastName || ''}`.trim() || undefined,
      contactEmail: formVal.email || undefined,
      contactPhone: formVal.contactPhone || undefined,
      shippingAddress: {
        line1: formVal.line1 || undefined,
        line2: formVal.line2 || undefined,
        city: formVal.city || undefined,
        governorate: formVal.governorate || undefined,
        postalCode: formVal.postalCode || undefined,
        country: formVal.country || 'EG',
      },
      customerNote: formVal.customerNote || undefined,
    });

    const storeSlug = this.activeStoreSlug();
    toast.info(this.locale.translate('checkout.toast.guest_sign_in_prompt'));
    this.router.navigate(['/', storeSlug, 'auth', 'login'], {
      queryParams: { returnUrl: `/${storeSlug}/checkout` },
    });
  }

  onSubmit(): void {
    if (this.cartItems().length === 0) {
      toast.warning(this.locale.translate('checkout.toast.cart_empty'));
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.onGuestProceedToLogin();
      return;
    }

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      toast.error(this.locale.translate('checkout.toast.validation_error'));
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.checkoutForm.getRawValue();

    const payload: CreateOrderPayload = {
      items: this.cartItems().map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      shippingAddress: {
        line1: formVal.line1?.trim() || '',
        line2: formVal.line2?.trim() || undefined,
        city: formVal.city?.trim() || '',
        governorate: formVal.governorate?.trim() || undefined,
        postalCode: formVal.postalCode?.trim() || undefined,
        country: (formVal.country?.trim() || 'EG').toUpperCase(),
      },
      contactPhone: formVal.contactPhone?.trim() || '',
      customerNote: formVal.customerNote?.trim() || undefined,
      paymentMethod: 'cod',
    };

    const storeSlug = this.activeStoreSlug();

    this.cartService.placeOrder(storeSlug, payload).subscribe({
      next: (placedOrder) => {
        this.isSubmitting.set(false);
        const enteredName = `${formVal.firstName || ''} ${formVal.lastName || ''}`.trim();
        if (enteredName && placedOrder.orderNumber != null) {
          this.ordersService.saveRecipientOverride(placedOrder.orderNumber, enteredName);
        }
        const finalOrder = {
          ...placedOrder,
          createdAt: placedOrder.createdAt || new Date().toISOString(),
          contactName: enteredName || placedOrder.contactName,
        };
        this.cartService.setLastPlacedOrder(finalOrder);
        this.cartService.clearCart();
        this.cartService.clearPrefill();

        toast.success(
          this.locale.translate('checkout.toast.order_placed', {
            orderNumber: placedOrder.orderNumber,
          }),
        );
        this.router.navigate(['/', storeSlug, 'order-confirmed'], {
          queryParams: { orderNumber: placedOrder.orderNumber },
        });
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);

        if (this.isUnavailableItemsError(err)) {
          // Recoverable: the backend rejected one or more variantIds in the cart (often a
          // stale cart adopted from a different store — see CartService.readNamespaced).
          // A plain toast is a dead end here since nothing about the form was wrong, so offer
          // a real way out instead of just naming the problem.
          toast.error(this.locale.translate('checkout.toast.unavailable_items'), {
            duration: 10000,
            action: {
              label: this.locale.translate('checkout.toast.clear_cart_action'),
              onClick: () => this.recoverFromUnavailableItems(),
            },
          });
          return;
        }

        const errorMsg = extractErrorMessage(
          err,
          this.locale.translate('checkout.toast.order_failed'),
        );
        toast.error(errorMsg);
      },
    });
  }

  /**
   * Matches the two message shapes `describeUnavailable()` in the backend's
   * `checkout.service.ts` can throw for a 400 on unknown/foreign `variantId`s:
   *   - generic: `items: one of these products is no longer available` (matched zero variants
   *     for the store — e.g. every id in a stale, wrong-store cart)
   *   - named:   `items: "Title A", "Title B" is no longer available`
   * Both end in "is no longer available", which nothing else in the checkout flow produces.
   */
  private isUnavailableItemsError(err: unknown): boolean {
    const message = extractErrorMessage(err, '');
    return /is no longer available/i.test(message);
  }

  /** The shopper's way out of an unrecoverable stale/foreign cart: start over. */
  private recoverFromUnavailableItems(): void {
    this.cartService.clearCart();
    this.cartService.clearPrefill();
    toast.info(this.locale.translate('checkout.toast.cart_cleared'));
  }
}
