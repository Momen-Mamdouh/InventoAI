import { HlmTextareaImports } from '@spartan/helm/textarea';
import { HlmDialogImports } from '@spartan/helm/dialog';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { SkeletonBlock } from '@invento/shared';
import { TranslatePipe } from '@invento/core';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

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
  lucideChevronDown,
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
import { CartService } from '@invento/user-site/app/core/service/cart.service';
import { FormatOrderDatePipe } from '@invento/user-site/app/core/pipes/format-date.pipe';
import { formatOrderDate } from '@invento/user-site/app/core/utils/date.utils';
import type {
  CartItem,
  PrefillCustomerInfo,
} from '@invento/user-site/app/core/interface/cart.interface';
import {
  OrdersDataService,
  type OrderDetail,
  type OrderStatus,
  type OrderStatusConfig,
  type OrderSummaryItem,
  type OrderTimelineStep,
} from '@invento/user-site/app/features/orders';

@Component({
  selector: 'app-order-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HlmTextareaImports,
    HlmDialogImports,
    BrnDialogContent,
    ...HlmTypographyImports,
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
      lucideChevronDown,
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

  // Local UI states
  protected readonly isExpanded = signal<boolean>(false);
  protected readonly isCancelModalOpen = signal<boolean>(false);
  protected readonly isReordering = signal<boolean>(false);
  protected readonly selectedPreset = signal<string | null>(null);
  protected readonly cancelReason = signal<string>('');
  protected readonly copiedField = signal<string | null>(null);

  // Preset cancellation reasons
  protected readonly presetReasons: string[] = [
    'Ordered wrong size or color',
    'Changed my mind',
    'Need to change delivery address',
    'Found a better price elsewhere',
    'Delivery time is too long',
    'Duplicate order by mistake',
  ];

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

    if (status === 'cancelled') {
      return [
        {
          title: 'Order Placed',
          date: this.order().createdAt,
          completed: true,
          current: false,
        },
        {
          title: 'Order Cancelled',
          date: details?.cancelledAt || undefined,
          subtitle: details?.cancelReason
            ? `Reason: ${details.cancelReason}`
            : 'Cancelled by customer',
          completed: true,
          current: true,
          isCancelled: true,
        },
      ];
    }

    const steps: OrderTimelineStep[] = [
      {
        title: 'Order Placed',
        date: this.order().createdAt,
        completed: true,
        current: status === 'pending',
      },
      {
        title: 'Confirmed',
        date: undefined,
        completed: ['confirmed', 'shipped', 'delivered'].includes(status),
        current: status === 'confirmed',
      },
      {
        title: 'Shipped',
        date: undefined,
        completed: ['shipped', 'delivered'].includes(status),
        current: status === 'shipped',
      },
      {
        title: 'Delivered',
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

  protected toggleDetails(): void {
    const nextState = !this.isExpanded();
    this.isExpanded.set(nextState);

    if (nextState && !this.orderDetails()) {
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

  protected selectPresetReason(preset: string): void {
    if (this.selectedPreset() === preset) {
      // Deselect
      this.selectedPreset.set(null);
      this.cancelReason.set('');
    } else {
      this.selectedPreset.set(preset);
      this.cancelReason.set(preset);
    }
  }

  protected onCancelReasonInput(event: Event): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.cancelReason.set(input.value);
    // If input differs from selected preset, unselect badge
    if (this.selectedPreset() && input.value !== this.selectedPreset()) {
      this.selectedPreset.set(null);
    }
  }

  protected async confirmCancelOrder(): Promise<void> {
    const orderNumber = this.order().orderNumber;
    const reason = this.cancelReason().trim();

    const result = await this.ordersService.cancelOrder(orderNumber, reason);

    if (result.success) {
      toast.success(`Order #${orderNumber} has been cancelled.`);
      this.closeCancelModal();
    } else {
      toast.error(result.message || `Unable to cancel order #${orderNumber}.`);
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
        toast.error('Unable to load items for this order.');
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
        toast.warning('No available variant items found to reorder.');
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
      toast.success('Order items added to checkout!');
      this.router.navigate(['/', this.ordersService.activeStoreSlug(), 'checkout']);
    } catch (err: unknown) {
      console.error('[OrderCardComponent] Reorder failed:', err);
      toast.error('Failed to prepare reorder. Please try again.');
    } finally {
      this.isReordering.set(false);
    }
  }

  protected printReceipt(): void {
    const orderNumber = this.order().orderNumber;
    const details = this.orderDetails();

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      toast.info('Please allow popups to print receipt.');
      return;
    }

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
      `<tr><td colspan="4" style="padding: 12px; text-align: center;">${this.order().itemCount} items</td></tr>`;

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
          <title>Receipt - Order #${orderNumber}</title>
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
              <h1 style="margin: 0 0 6px 0; font-size: 24px;">Order Receipt</h1>
              <div style="font-size: 14px; color: #6b7280;">Order #${orderNumber} • ${formatOrderDate(this.order().createdAt)}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">${this.order().status}</span>
              <div style="margin-top: 8px; font-size: 13px; color: #6b7280;">Payment: ${this.order().paymentMethod.toUpperCase()} (${this.order().paymentStatus})</div>
            </div>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #6b7280;">Shipping To</h3>
            ${addressHtml}
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
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
                  <td style="color: #6b7280;">Subtotal</td>
                  <td style="text-align: right;">${(details.subtotalAmount / 100).toFixed(2)} ${this.order().currency}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280;">Shipping</td>
                  <td style="text-align: right;">${details.shippingFee === 0 ? 'Free' : (details.shippingFee / 100).toFixed(2) + ' ' + this.order().currency}</td>
                </tr>
              `
                  : ''
              }
              <tr class="total-row">
                <td>Total</td>
                <td style="text-align: right;">${(this.order().totalAmount / 100).toFixed(2)} ${this.order().currency}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
            Thank you for shopping with us!
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
