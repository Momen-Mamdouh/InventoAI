import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlertCircle,
  lucideBuilding2,
  lucideCheck,
  lucideCheckCircle2,
  lucideChevronDown,
  lucideChevronUp,
  lucideClock3,
  lucideCopy,
  lucideEdit3,
  lucideExternalLink,
  lucideFileText,
  lucideInbox,
  lucideLock,
  lucideMail,
  lucidePackage,
  lucideRefreshCw,
  lucideSend,
  lucideSlidersHorizontal,
  lucideSparkles,
  lucideTrash2,
  lucideTrendingDown,
  lucideTruck,
  lucideX,
  lucideZap,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmButton } from '@spartan/helm/button';
import { HlmCard } from '@spartan/helm/card';
import { HlmInput } from '@spartan/helm/input';
import { HlmLabel } from '@spartan/helm/label';
import { HlmTextarea } from '@spartan/helm/textarea';
import { HlmTooltip } from '@spartan/helm/tooltip';
import { HlmH2, HlmMuted } from '@spartan/helm/typography';
import {
  HlmDialog,
  HlmDialogContent,
  HlmDialogDescription,
  HlmDialogFooter,
  HlmDialogHeader,
  HlmDialogTitle,
} from '@spartan/helm/dialog';
import {
  HlmAlertDialog,
  HlmAlertDialogAction,
  HlmAlertDialogCancel,
  HlmAlertDialogContent,
  HlmAlertDialogDescription,
  HlmAlertDialogFooter,
  HlmAlertDialogHeader,
  HlmAlertDialogTitle,
} from '@spartan/helm/alert-dialog';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import { BrnAlertDialogContent } from '@spartan-ng/brain/alert-dialog';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import {
  PurchaseRequestDetail,
  PurchaseRequestsState,
  PurchaseRequestStatus,
  SupplierOffer,
} from '@invento/owner-dashboard-data-access-purchase-request';

@Component({
  selector: 'app-purchase-request-details',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    TitleCasePipe,
    FormsModule,
    NgIcon,
    HlmBadge,
    HlmButton,
    HlmCard,
    HlmInput,
    HlmLabel,
    HlmTextarea,
    HlmTooltip,
    HlmH2,
    HlmMuted,
    HlmDialog,
    HlmDialogContent,
    HlmDialogHeader,
    HlmDialogTitle,
    HlmDialogDescription,
    HlmDialogFooter,
    HlmAlertDialog,
    HlmAlertDialogContent,
    HlmAlertDialogHeader,
    HlmAlertDialogTitle,
    HlmAlertDialogDescription,
    HlmAlertDialogFooter,
    HlmAlertDialogAction,
    HlmAlertDialogCancel,
    BrnDialogContent,
    BrnAlertDialogContent,
    TranslatePipe,
  ],
  providers: [
    provideIcons({
      lucideAlertCircle,
      lucideBuilding2,
      lucideCheck,
      lucideCheckCircle2,
      lucideChevronDown,
      lucideChevronUp,
      lucideClock3,
      lucideCopy,
      lucideEdit3,
      lucideExternalLink,
      lucideFileText,
      lucideInbox,
      lucideLock,
      lucideMail,
      lucidePackage,
      lucideRefreshCw,
      lucideSend,
      lucideSlidersHorizontal,
      lucideSparkles,
      lucideTrash2,
      lucideTrendingDown,
      lucideTruck,
      lucideX,
      lucideZap,
    }),
  ],
  templateUrl: './purchase-request-details.html',
})
export class PurchaseRequestDetails {
  private readonly router = inject(Router);
  private readonly state = inject(PurchaseRequestsState);
  private readonly localeService = inject(LocaleService);

  readonly request = input<PurchaseRequestDetail | null>(null);
  readonly closed = output<void>();

  readonly saving = this.state.saving;

  readonly activeTab = signal<'offers' | 'specs' | 'email'>('offers');
  readonly copiedId = signal<boolean>(false);
  readonly expandedRawReplies = signal<Record<string, boolean>>({});

  readonly showEdit = signal<boolean>(false);
  readonly showCancelConfirm = signal<boolean>(false);
  readonly showReply = signal<boolean>(false);
  readonly showOfferEdit = signal<boolean>(false);
  readonly offerToConfirm = signal<SupplierOffer | null>(null);
  readonly selectedOffer = signal<SupplierOffer | null>(null);

  editSubject = '';
  editBody = '';
  editQuantity = 1;
  editDeadline: number | null = null;
  editNote: string | null = null;
  editSupplierIds: string[] = [];

  replyBody = '';
  offerUnitMajor: number | null = null;
  offerQuantity: number | null = null;
  offerDeliveryDays: number | null = null;
  offerNotes: string | null = null;

  readonly shortId = computed<string>(() => {
    const id = this.request()?.id;
    return id ? id.slice(0, 8).toUpperCase() : '';
  });

  readonly recommendedOffer = computed<SupplierOffer | null>(() => {
    return this.request()?.offers.find((o) => o.isRecommended) ?? null;
  });

  readonly cheapestOffer = computed<SupplierOffer | null>(() => {
    return this.request()?.offers.find((o) => o.isCheapest) ?? null;
  });

  readonly fastestOffer = computed<SupplierOffer | null>(() => {
    return this.request()?.offers.find((o) => o.isFastest) ?? null;
  });

  readonly wonOffer = computed<SupplierOffer | null>(() => {
    return this.request()?.offers.find((o) => o.status === 'won') ?? null;
  });

  readonly bestUnitPrice = computed<number | null>(() => {
    const offers = this.request()?.offers ?? [];
    const priced = offers.filter((o) => o.unitAmount !== null).map((o) => o.unitAmount as number);
    return priced.length > 0 ? Math.min(...priced) : null;
  });

  readonly fastestDeliveryDays = computed<number | null>(() => {
    const offers = this.request()?.offers ?? [];
    const days = offers.filter((o) => o.deliveryDays !== null).map((o) => o.deliveryDays as number);
    return days.length > 0 ? Math.min(...days) : null;
  });

  readonly responseRate = computed<number>(() => {
    const req = this.request();
    if (!req || req.offerCount === 0) {
      return 0;
    }
    return Math.min(100, Math.round((req.receivedCount / req.offerCount) * 100));
  });

  readonly lifecycleStep = computed<number>(() => {
    const req = this.request();
    if (!req) {
      return 1;
    }
    if (req.status === 'draft') {
      return 1;
    }
    if (req.status === 'sent') {
      return 2;
    }
    if (req.status === 'replied') {
      return 3;
    }
    if (req.status === 'confirmed' || req.status === 'cancelled') {
      return 4;
    }
    return 1;
  });

  copyRequestId(): void {
    const req = this.request();
    if (!req) {
      return;
    }
    const fullId = `PR-${this.shortId()}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullId).then(() => {
        this.copiedId.set(true);
        setTimeout(() => this.copiedId.set(false), 2000);
      });
    }
  }

  toggleRawReply(offerId: string): void {
    this.expandedRawReplies.update((curr) => ({
      ...curr,
      [offerId]: !curr[offerId],
    }));
  }

  isRawReplyExpanded(offerId: string): boolean {
    return !!this.expandedRawReplies()[offerId];
  }

  statusClass(status: PurchaseRequestStatus): string {
    return {
      draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      sent: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      replied: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      confirmed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      cancelled: 'bg-destructive/10 text-destructive',
    }[status];
  }

  offerStatusClass(status: SupplierOffer['status']): string {
    return {
      awaiting: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      received: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      won: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold',
      declined: 'bg-destructive/10 text-destructive',
    }[status];
  }

  formatMoney(minor: number | null): number | null {
    return minor == null ? null : minor / 100;
  }

  onSheetStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') {
      this.closed.emit();
    }
  }

  refreshDetail(): void {
    this.state.refreshDetail();
  }

  openSupplier(offer: SupplierOffer): void {
    if (offer.supplierId) {
      this.router.navigate(['/suppliers', offer.supplierId]);
    }
  }

  openEdit(): void {
    const req = this.request();
    if (!req || req.status !== 'draft') {
      return;
    }
    this.editSubject = req.subject;
    this.editBody = req.body;
    this.editQuantity = req.quantity;
    this.editDeadline = req.neededWithinDays;
    this.editNote = req.note;
    this.editSupplierIds = req.offers
      .map((offer) => offer.supplierId)
      .filter((id): id is string => !!id);
    this.showEdit.set(true);
  }

  saveEdit(): void {
    const req = this.request();
    if (!req) {
      return;
    }
    this.state.updateRequest(
      req.id,
      {
        subject: this.editSubject,
        body: this.editBody,
        quantity: this.editQuantity,
        neededWithinDays: this.editDeadline,
        note: this.editNote,
        supplierIds: this.editSupplierIds,
      },
      () => {
        this.showEdit.set(false);
      },
    );
  }

  send(): void {
    const req = this.request();
    if (!req || req.status === 'confirmed' || req.status === 'cancelled') {
      return;
    }
    this.state.sendRequest(req.id);
  }

  cancel(): void {
    const req = this.request();
    if (!req) {
      return;
    }
    this.state.cancelRequest(req.id, () => {
      this.showCancelConfirm.set(false);
    });
  }

  openReply(offer: SupplierOffer): void {
    this.selectedOffer.set(offer);
    this.replyBody = '';
    this.showReply.set(true);
  }

  pasteReply(): void {
    const req = this.request();
    const offer = this.selectedOffer();
    if (!req || !offer || !this.replyBody.trim()) {
      return;
    }
    this.state.pasteReply(req.id, offer.id, { body: this.replyBody.trim() }, () => {
      this.showReply.set(false);
    });
  }

  openOfferEdit(offer: SupplierOffer): void {
    this.selectedOffer.set(offer);
    this.offerUnitMajor = offer.unitAmount == null ? null : offer.unitAmount / 100;
    this.offerQuantity = offer.quantity;
    this.offerDeliveryDays = offer.deliveryDays;
    this.offerNotes = offer.notes;
    this.showOfferEdit.set(true);
  }

  saveOffer(): void {
    const req = this.request();
    const offer = this.selectedOffer();
    if (!req || !offer) {
      return;
    }
    this.state.correctOffer(
      req.id,
      offer.id,
      {
        unitAmount: this.offerUnitMajor == null ? null : Math.round(this.offerUnitMajor * 100),
        quantity: this.offerQuantity,
        deliveryDays: this.offerDeliveryDays,
        notes: this.offerNotes,
      },
      () => {
        this.showOfferEdit.set(false);
      },
    );
  }

  confirmOffer(offer: SupplierOffer): void {
    const req = this.request();
    if (
      !req ||
      offer.unitAmount == null ||
      req.status === 'confirmed' ||
      req.status === 'cancelled'
    ) {
      return;
    }
    this.offerToConfirm.set(offer);
  }

  proceedConfirmOffer(): void {
    const req = this.request();
    const offer = this.offerToConfirm();
    if (!req || !offer) {
      return;
    }
    this.state.confirmOffer(req.id, offer.id, offer.supplierName, () => {
      this.offerToConfirm.set(null);
    });
  }
}
