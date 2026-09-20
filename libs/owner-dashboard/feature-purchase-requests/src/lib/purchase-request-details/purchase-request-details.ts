import {
  ChangeDetectionStrategy,
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
  lucideCheck,
  lucideCheckCircle2,
  lucideClock3,
  lucideEdit3,
  lucideExternalLink,
  lucideMail,
  lucideRefreshCw,
  lucideSend,
  lucideTrash2,
  lucideX,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmButton } from '@spartan/helm/button';
import { HlmCard } from '@spartan/helm/card';
import { HlmInput } from '@spartan/helm/input';
import { HlmLabel } from '@spartan/helm/label';
import { HlmTextarea } from '@spartan/helm/textarea';
import { HlmTooltip } from '@spartan/helm/tooltip';
import { HlmH2, HlmMuted } from '@spartan/helm/typography';
import { HlmSheet, HlmSheetContent, HlmSheetPortal } from '@spartan/helm/sheet';
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
    HlmSheet,
    HlmSheetContent,
    HlmSheetPortal,
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
      lucideCheck,
      lucideCheckCircle2,
      lucideClock3,
      lucideEdit3,
      lucideExternalLink,
      lucideMail,
      lucideRefreshCw,
      lucideSend,
      lucideTrash2,
      lucideX,
    }),
  ],
  templateUrl: './purchase-request-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseRequestDetails {
  private readonly router = inject(Router);
  private readonly state = inject(PurchaseRequestsState);
  private readonly localeService = inject(LocaleService);

  readonly request = input<PurchaseRequestDetail | null>(null);
  readonly closed = output<void>();

  readonly saving = this.state.saving;

  protected readonly sheetSide = computed<'left' | 'right'>(() =>
    this.localeService.isRtl() ? 'left' : 'right',
  );

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

  statusClass(status: PurchaseRequestStatus): string {
    return {
      draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      sent: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      replied: 'bg-warning/10 text-warning',
      confirmed: 'bg-success/10 text-success',
      cancelled: 'bg-destructive/10 text-destructive',
    }[status];
  }

  offerStatusClass(status: SupplierOffer['status']): string {
    return {
      awaiting: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      received: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
      won: 'bg-success/10 text-success',
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
    if (!req || req.status !== 'draft') return;
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
    if (!req) return;
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
    if (!req || req.status === 'confirmed' || req.status === 'cancelled') return;
    this.state.sendRequest(req.id);
  }

  cancel(): void {
    const req = this.request();
    if (!req) return;
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
    if (!req || !offer || !this.replyBody.trim()) return;
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
    if (!req || !offer) return;
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
    if (!req || !offer) return;
    this.state.confirmOffer(req.id, offer.id, offer.supplierName, () => {
      this.offerToConfirm.set(null);
    });
  }
}
