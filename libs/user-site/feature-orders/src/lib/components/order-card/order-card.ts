import { HlmTextareaImports } from '@spartan/helm/textarea';
import { HlmLabel } from '@spartan/helm/label';
import { HlmDialogImports } from '@spartan/helm/dialog';
import { HlmAccordionImports } from '@spartan/helm/accordion';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { HlmSpinner } from '@spartan/helm/spinner';
import { SkeletonBlock } from '@invento/shared-ui-skeleton-block';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { HlmBadge } from '@spartan/helm/badge';
import { HlmButtonImports } from '@spartan/helm/button';
import { provideIcons, NgIconComponent } from '@ng-icons/core';
import {
  lucideCircleCheck,
  lucideClock,
  lucideCircleX,
  lucideTruck,
  lucideCalendar,
  lucideRotateCcw,
  lucideDownload,
  lucidePrinter,
  lucideMapPin,
  lucideCreditCard,
  lucideCopy,
  lucideAlertTriangle,
  lucideExternalLink,
  lucidePackage,
  lucideInfo,
  lucideLoader2,
  lucideShoppingCart,
} from '@ng-icons/lucide';
import { toast } from '@spartan/helm/sonner';
import { CartService } from '@invento/user-site-data-access-cart';
import { FormatOrderDatePipe, formatOrderDate } from '@invento/shared-util-pipes';
import type { CartItem, PrefillCustomerInfo } from '@invento/user-site-data-access-cart';
import {
  OrdersDataService,
  type OrderDetail,
  type OrderStatus,
  type OrderStatusConfig,
  type OrderSummaryItem,
  type OrderTimelineStep,
} from '@invento/user-site-data-access-order';

/** A translated cancellation-reason option: `key` identifies it, `label` is the localized text
 *  shown to the user and stored as the actual cancel reason sent to the server. */
interface PresetReason {
  key: string;
  label: string;
}

@Component({
  selector: 'app-order-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HlmTextareaImports,
    HlmLabel,
    HlmDialogImports,
    BrnDialogContent,
    HlmAccordionImports,
    ...HlmTypographyImports,
    HlmBadge,
    HlmSpinner,
    SkeletonBlock,
    CommonModule,
    CurrencyPipe,
    RouterLink,
    HlmButtonImports,
    NgIconComponent,
    FormatOrderDatePipe,
    TranslatePipe,
  ],

  providers: [
    provideIcons({
      lucideCircleCheck,
      lucideClock,
      lucideCircleX,
      lucideTruck,
      lucideCalendar,
      lucideRotateCcw,
      lucideDownload,
      lucidePrinter,
      lucideMapPin,
      lucideCreditCard,
      lucideCopy,
      lucideAlertTriangle,
      lucideExternalLink,
      lucidePackage,
      lucideInfo,
      lucideLoader2,
      lucideShoppingCart,
    }),
  ],
  templateUrl: './order-card.html',
  styleUrl: './order-card.css',
})
export class OrderCardComponent {
  readonly order = input.required<OrderSummaryItem>();

  protected readonly ordersService = inject(OrdersDataService);
  protected readonly cartService = inject(CartService);
  protected readonly router = inject(Router);
  // Class-side strings (toasts, preset reasons, timeline labels) are translated here rather
  // than by the pipe, matching the pattern established in orders-filter-bar.ts.
  private readonly locale = inject(LocaleService);

  // Local UI states
  protected readonly isExpanded = signal<boolean>(false);
  protected readonly isCancelModalOpen = signal<boolean>(false);
  protected readonly isReordering = signal<boolean>(false);
  protected readonly selectedPreset = signal<PresetReason | null>(null);
  protected readonly cancelReason = signal<string>('');
  protected readonly copiedField = signal<string | null>(null);

  // Preset cancellation reasons — translated labels; the label text becomes the reason value
  // sent to the server, so it must be recomputed whenever the active locale changes.
  private static readonly PRESET_REASON_KEYS = [
    'wrong_size',
    'changed_mind',
    'change_address',
    'better_price',
    'long_delivery',
    'duplicate_order',
  ] as const;

  protected readonly presetReasons = computed<PresetReason[]>(() => {
    this.locale.locale(); // re-compute labels when the language changes
    return OrderCardComponent.PRESET_REASON_KEYS.map((key) => ({
      key,
      label: this.locale.translate(`orders.card.cancel_reasons.${key}`),
    }));
  });

  // Computed state for order details
  protected readonly orderDetails = computed<OrderDetail | undefined>(() =>
    this.ordersService.orderDetailsMap().get(this.order().orderNumber),
  );

  protected readonly isLoadingDetails = computed<boolean>(() =>
    this.ordersService.loadingDetails().has(this.order().orderNumber),
  );

  protected readonly isCancelling = computed<boolean>(
    () => this.ordersService.isCancelling() === this.order().orderNumber,
  );

  protected readonly timelineSteps = computed<OrderTimelineStep[]>(() => {
    const status = this.order().status;
    const details = this.orderDetails();
    this.locale.locale(); // re-compute titles/subtitles when the language changes
    const t = (key: string) => this.locale.translate(`orders.card.timeline.${key}`);

    if (status === 'cancelled') {
      return [
        {
          title: t('order_placed'),
          date: this.order().createdAt,
          completed: true,
          current: false,
        },
        {
          title: t('order_cancelled'),
          date: details?.cancelledAt || undefined,
          subtitle: details?.cancelReason
            ? `${t('cancel_reason_prefix')} ${details.cancelReason}`
            : t('cancelled_by_customer'),
          completed: true,
          current: true,
          isCancelled: true,
        },
      ];
    }

    const steps: OrderTimelineStep[] = [
      {
        title: t('order_placed'),
        date: this.order().createdAt,
        completed: true,
        current: status === 'pending',
      },
      {
        title: t('confirmed'),
        date: undefined,
        completed: ['confirmed', 'shipped', 'delivered'].includes(status),
        current: status === 'confirmed',
      },
      {
        title: t('shipped'),
        date: undefined,
        completed: ['shipped', 'delivered'].includes(status),
        current: status === 'shipped',
      },
      {
        title: t('delivered'),
        date: undefined,
        completed: status === 'delivered',
        current: status === 'delivered',
      },
    ];

    return steps;
  });

  protected getStatusConfig(status: OrderStatus): OrderStatusConfig {
    return this.ordersService.getStatusConfig(status);
  }

  protected onDetailsToggled(opened: boolean): void {
    this.isExpanded.set(opened);

    if (opened && !this.orderDetails()) {
      this.ordersService.loadOrderDetails(this.order().orderNumber);
    }
  }

  protected copyText(text: string, fieldName: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text);
    this.copiedField.set(fieldName);
    setTimeout(() => {
      this.copiedField.set(null);
    }, 2000);
  }

  protected openCancelModal(): void {
    this.selectedPreset.set(null);
    this.cancelReason.set('');
    this.isCancelModalOpen.set(true);
  }
  protected onCancelDialogState(state: 'open' | 'closed'): void {
    if (state === 'closed') this.closeCancelModal();
  }

  protected closeCancelModal(): void {
    this.isCancelModalOpen.set(false);
  }

  protected selectPresetReason(preset: PresetReason): void {
    if (this.selectedPreset()?.key === preset.key) {
      // Deselect
      this.selectedPreset.set(null);
      this.cancelReason.set('');
    } else {
      this.selectedPreset.set(preset);
      this.cancelReason.set(preset.label);
    }
  }

  protected onCancelReasonInput(event: Event): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.cancelReason.set(input.value);
    // If input differs from selected preset, unselect badge
    const selected = this.selectedPreset();
    if (selected && input.value !== selected.label) {
      this.selectedPreset.set(null);
    }
  }

  protected async confirmCancelOrder(): Promise<void> {
    const orderNumber = this.order().orderNumber;
    const reason = this.cancelReason().trim();

    const result = await this.ordersService.cancelOrder(orderNumber, reason);

    if (result.success) {
      toast.success(this.locale.translate('orders.card.toast.order_cancelled', { orderNumber }));
      this.closeCancelModal();
    } else {
      toast.error(
        result.message || this.locale.translate('orders.card.toast.cancel_failed', { orderNumber }),
      );
    }
  }

  protected async reorder(): Promise<void> {
    this.isReordering.set(true);
    try {
      let details: OrderDetail | null | undefined = this.orderDetails();
      if (!details) {
        details = await this.ordersService.loadOrderDetails(this.order().orderNumber);
      }

      if (!details || !details.items || details.items.length === 0) {
        toast.error(this.locale.translate('orders.card.toast.load_items_failed'));
        return;
      }

      const cartItems: CartItem[] = details.items
        .filter((item) => !!item.variantId)
        .map((item) => ({
          variantId: item.variantId!,
          productId: item.productId,
          productSlug: item.productSlug,
          productTitle: item.productTitle,
          productImageUrl: item.productImageUrl,
          variantOptions: item.variantOptions,
          sku: item.sku,
          unitAmount: item.unitAmount,
          quantity: item.quantity,
          lineTotalAmount: item.lineTotalAmount,
        }));

      if (cartItems.length === 0) {
        toast.warning(this.locale.translate('orders.card.toast.no_variant_items'));
        return;
      }

      const prefill: PrefillCustomerInfo = {
        contactName: details.contactName || this.order().contactName,
        contactEmail: details.contactEmail || this.order().contactEmail,
        contactPhone: details.contactPhone,
        shippingAddress: details.shippingAddress,
        customerNote: details.customerNote || undefined,
      };

      this.cartService.setReorder(cartItems, prefill, this.order().currency);
      toast.success(this.locale.translate('orders.card.toast.reorder_added'));
      this.router.navigate(['/', this.ordersService.activeStoreSlug(), 'checkout']);
    } catch (err: unknown) {
      console.error('[OrderCardComponent] Reorder failed:', err);
      toast.error(this.locale.translate('orders.card.toast.reorder_failed'));
    } finally {
      this.isReordering.set(false);
    }
  }

  protected printReceipt(): void {
    const orderNumber = this.order().orderNumber;
    const details = this.orderDetails();

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      toast.info(this.locale.translate('orders.card.toast.popup_blocked'));
      return;
    }

    // The receipt is a standalone print document, not part of this component's own template —
    // its static chrome (headings, table labels) is translated here via LocaleService so an
    // Arabic-locale customer reads Arabic labels, but the document layout itself stays LTR:
    // mirroring it for RTL is a print-layout concern, out of scope for an i18n text pass.
    const t = (key: string, params?: Record<string, string | number>) =>
      this.locale.translate(`orders.card.receipt.${key}`, params);
    const itemLabel =
      this.order().itemCount === 1
        ? this.locale.translate('orders.card.item_singular')
        : this.locale.translate('orders.card.item_plural');
    const statusLabel = this.locale.translate(
      this.ordersService.getStatusConfig(this.order().status).label,
    );

    const itemsHtml =
      details?.items
        ?.map(
          (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.productTitle}</strong>
          ${Object.entries(item.variantOptions || {})
            .map(([k, v]) => `<div style="font-size: 11px; color: #6b7280;">${k}: ${v}</div>`)
            .join('')}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${(item.unitAmount / 100).toFixed(2)} ${this.order().currency}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${(item.lineTotalAmount / 100).toFixed(2)} ${this.order().currency}</td>
      </tr>
    `,
        )
        .join('') ||
      `<tr><td colspan="4" style="padding: 12px; text-align: center;">${this.order().itemCount} ${itemLabel}</td></tr>`;

    const addressHtml = details?.shippingAddress
      ? `
      <p style="margin: 0;">${details.contactName || this.order().contactName}</p>
      <p style="margin: 4px 0 0 0; color: #4b5563;">${details.shippingAddress.line1} ${details.shippingAddress.line2 || ''}</p>
      <p style="margin: 2px 0 0 0; color: #4b5563;">${details.shippingAddress.city}, ${details.shippingAddress.governorate || ''} ${details.shippingAddress.postalCode || ''}</p>
      <p style="margin: 2px 0 0 0; color: #4b5563;">${details.shippingAddress.country}</p>
    `
      : `<p>${this.order().contactName} (${this.order().contactEmail})</p>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('title_prefix', { orderNumber })}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #111827; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 20px; margin-bottom: 24px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: #f3f4f6; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th { text-align: left; padding: 10px; background: #f9fafb; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
            .summary { margin-top: 24px; display: flex; justify-content: flex-end; }
            .summary-table { width: 280px; }
            .summary-table td { padding: 6px 10px; }
            .total-row td { font-size: 16px; font-weight: bold; border-top: 2px solid #111827; padding-top: 10px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin: 0 0 6px 0; font-size: 24px;">${t('heading')}</h1>
              <div style="font-size: 14px; color: #6b7280;">${t('order_line', { orderNumber })} • ${formatOrderDate(this.order().createdAt)}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">${statusLabel}</span>
              <div style="margin-top: 8px; font-size: 13px; color: #6b7280;">${t('payment_label')} ${this.order().paymentMethod.toUpperCase()} (${this.order().paymentStatus})</div>
            </div>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #6b7280;">${t('shipping_to')}</h3>
            ${addressHtml}
          </div>

          <table>
            <thead>
              <tr>
                <th>${t('table_item')}</th>
                <th style="text-align: center;">${t('table_qty')}</th>
                <th style="text-align: right;">${t('table_price')}</th>
                <th style="text-align: right;">${t('table_total')}</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary">
            <table class="summary-table">
              ${
                details
                  ? `
                <tr>
                  <td style="color: #6b7280;">${t('subtotal')}</td>
                  <td style="text-align: right;">${(details.subtotalAmount / 100).toFixed(2)} ${this.order().currency}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">${t('shipping')}</td>
                  <td style="text-align: right;">${details.shippingFee === 0 ? t('free') : (details.shippingFee / 100).toFixed(2) + ' ' + this.order().currency}</td>
                </tr>
              `
                  : ''
              }
              <tr class="total-row">
                <td>${t('total')}</td>
                <td style="text-align: right;">${(this.order().totalAmount / 100).toFixed(2)} ${this.order().currency}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
            ${t('thanks')}
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
