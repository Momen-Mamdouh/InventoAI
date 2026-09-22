import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucidePackage,
  lucideTruck,
  lucideCheckCircle2,
  lucideXCircle,
  lucideClock,
  lucideUser,
  lucideMail,
  lucidePhone,
  lucideMapPin,
  lucideCreditCard,
  lucideBanknote,
  lucideFileText,
  lucideSave,
  lucideBan,
  lucideX,
  lucideAlertCircle,
  lucideCalendar,
  lucideExternalLink,
  lucideTag,
  lucideCheck,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { HlmBadge } from '@spartan/helm/badge';
import {
  HlmCard,
  HlmCardHeader,
  HlmCardTitle,
  HlmCardContent,
} from '@spartan/helm/card';
import { HlmSpinner } from '@spartan/helm/spinner';
import { HlmAlert, HlmAlertTitle, HlmAlertDescription } from '@spartan/helm/alert';
import {
  HlmAlertDialog,
  HlmAlertDialogContent,
} from '@spartan/helm/alert-dialog';
import { BrnAlertDialogContent } from '@spartan-ng/brain/alert-dialog';
import { HlmTextarea } from '@spartan/helm/textarea';
import { HlmSeparator } from '@spartan/helm/separator';
import {
  HlmH1,
  HlmMuted,
} from '@spartan/helm/typography';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { BreadcrumbService } from '@invento/owner-dashboard-util-breadcrumb';
import {
  OrderStore,
  type OrderStatus,
} from '@invento/owner-dashboard-data-access-order';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [
    CurrencyPipe,
    NgClass,
    FormsModule,
    NgIcon,
    HlmButton,
    HlmBadge,
    HlmCard,
    HlmCardHeader,
    HlmCardTitle,
    HlmCardContent,
    HlmSpinner,
    HlmAlert,
    HlmAlertTitle,
    HlmAlertDescription,
    HlmAlertDialog,
    HlmAlertDialogContent,
    BrnAlertDialogContent,
    HlmTextarea,
    HlmSeparator,
    HlmH1,
    HlmMuted,
    TranslatePipe,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucidePackage,
      lucideTruck,
      lucideCheckCircle2,
      lucideXCircle,
      lucideClock,
      lucideUser,
      lucideMail,
      lucidePhone,
      lucideMapPin,
      lucideCreditCard,
      lucideBanknote,
      lucideFileText,
      lucideSave,
      lucideBan,
      lucideX,
      lucideAlertCircle,
      lucideCalendar,
      lucideExternalLink,
      lucideTag,
      lucideCheck,
    }),
  ],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(OrderStore);
  private readonly localeService = inject(LocaleService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  readonly orderId = signal<string>('');
  readonly internalNoteDraft = signal<string>('');
  readonly isCancelModalOpen = signal<boolean>(false);
  readonly cancelReason = signal<string>('');

  constructor() {
    effect(() => {
      const order = this.store.selectedOrder();
      if (order) {
        this.internalNoteDraft.set(order.internalNote ?? '');
        this.breadcrumbService.setLabel(order.id, `#${order.orderNumber}`);
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.orderId.set(id);
      this.store.loadOrderDetail(id);
    }
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  confirmOrder(): void {
    const order = this.store.selectedOrder();
    if (order) {
      this.store.updateOrderStatus(order.id, 'confirmed');
    }
  }

  shipOrder(): void {
    const order = this.store.selectedOrder();
    if (order) {
      this.store.updateOrderStatus(order.id, 'shipped');
    }
  }

  deliverOrder(): void {
    const order = this.store.selectedOrder();
    if (order) {
      this.store.updateOrderStatus(order.id, 'delivered');
    }
  }

  openCancelModal(): void {
    this.cancelReason.set('');
    this.isCancelModalOpen.set(true);
  }

  closeCancelModal(): void {
    this.isCancelModalOpen.set(false);
    this.cancelReason.set('');
  }

  onCancelModalStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') {
      this.closeCancelModal();
    }
  }

  submitCancelOrder(): void {
    const order = this.store.selectedOrder();
    const reason = this.cancelReason().trim();
    if (!order || !reason) {
      return;
    }

    this.store.updateOrderStatus(order.id, 'cancelled', reason, () => {
      this.closeCancelModal();
    });
  }

  saveInternalNote(): void {
    const order = this.store.selectedOrder();
    const note = this.internalNoteDraft().trim();
    if (!order || !note) {
      return;
    }
    this.store.updateOrderNote(order.id, note);
  }

  // Helpers
  formatMinorUnits(minorUnits: number | null | undefined): number {
    if (minorUnits === null || minorUnits === undefined) {
      return 0;
    }
    return minorUnits / 100;
  }

  canConfirm(status: OrderStatus | string): boolean {
    return status === 'pending';
  }

  canShip(status: OrderStatus | string): boolean {
    return status === 'confirmed';
  }

  canDeliver(status: OrderStatus | string): boolean {
    return status === 'shipped';
  }

  canCancel(status: OrderStatus | string): boolean {
    return status === 'pending' || status === 'confirmed' || status === 'shipped';
  }

  isTerminal(status: OrderStatus | string): boolean {
    return status === 'delivered' || status === 'cancelled';
  }

  getDatePart(dateString: string): string {
    try {
      const d = new Date(dateString);
      const localeCode = this.localeService.locale() === 'ar' ? 'ar-EG' : 'en-GB';
      return d.toLocaleDateString(localeCode, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString.split('T')[0] ?? dateString;
    }
  }

  getTimePart(dateString: string): string {
    try {
      const d = new Date(dateString);
      const localeCode = this.localeService.locale() === 'ar' ? 'ar-EG' : 'en-US';
      return d.toLocaleTimeString(localeCode, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateString.split('T')[1]?.slice(0, 5) ?? '';
    }
  }

  getFullDateTime(dateString: string): string {
    return `${this.getDatePart(dateString)} ${this.getTimePart(dateString)}`;
  }

  getFulfillmentBadgeClass(status: string): string {
    switch (status) {
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'delivered':
        return 'bg-success/10 text-success border-success/20';
      case 'shipped':
      case 'confirmed':
      case 'processing':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'pending':
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  }

  getPaymentBadgeClass(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'paid':
        return 'bg-success/10 text-success border-success/20';
      case 'refunded':
      case 'failed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'unpaid':
      case 'pending':
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  }

  getObjectEntries(obj: Record<string, string> | undefined | null): [string, string][] {
    return obj ? Object.entries(obj) : [];
  }
}
