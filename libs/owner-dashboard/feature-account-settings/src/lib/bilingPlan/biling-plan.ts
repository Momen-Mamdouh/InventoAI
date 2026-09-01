import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideZap,
  lucideCreditCard,
  lucideDownload,
  lucidePencil,
  lucideRefreshCw,
  lucideCheck,
  lucideX,
  lucideChevronRight,
  lucideUser,
  lucideShield,
  lucideBell,
  lucideStore,
  lucidePackage,
  lucideBarChart3,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmButton } from '@spartan/helm/button';
import { HlmInput } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmTableImports } from '@spartan/helm/table';
import { HlmDialogImports } from '@spartan/helm/dialog';
// Brain primitives are the plain npm package — not re-exported through the
// project's `@spartan/helm` alias, so import them directly (see category-form-dialog.ts).
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmH1, HlmH3, HlmH4, HlmMuted } from '@spartan/helm/typography';

export interface InvoiceRecord {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: 'Paid' | 'Failed' | 'Pending';
}

export interface PaymentCardInfo {
  type: string;
  last4: string;
  expiry: string;
  billingLocation: string;
}

export interface PlanInfo {
  name: string;
  price: string;
  billingCycle: string;
  renewsOn: string;
  status: string;
  storesLimit: string;
  productsLimit: string;
  analyticsLimit: string;
}

@Component({
  selector: 'app-biling-plan',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NgIcon,
    HlmBadge,
    HlmCardImports,
    HlmButton,
    HlmInput,
    HlmLabelImports,
    HlmTableImports,
    HlmDialogImports,
    BrnDialogImports,
    HlmH1,
    HlmH3,
    HlmH4,
    HlmMuted,
  ],
  providers: [
    provideIcons({
      lucideZap,
      lucideCreditCard,
      lucideDownload,
      lucidePencil,
      lucideRefreshCw,
      lucideCheck,
      lucideX,
      lucideChevronRight,
      lucideUser,
      lucideShield,
      lucideBell,
      lucideStore,
      lucidePackage,
      lucideBarChart3,
    }),
  ],
  templateUrl: './biling-plan.html',
  styleUrl: './biling-plan.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BilingPlanComponent {
  // Plan Data Signal
  plan = signal<PlanInfo>({
    name: 'Invento Pro',
    price: '$49',
    billingCycle: '/ month',
    renewsOn: 'July 1, 2025',
    status: 'Active',
    storesLimit: 'Up to 5 AI-generated stores',
    productsLimit: 'Unlimited products',
    analyticsLimit: 'Full analytics',
  });

  // Payment Card Signal
  paymentCard = signal<PaymentCardInfo>({
    type: 'Visa',
    last4: '4242',
    expiry: '09/2027',
    billingLocation: 'Portland, OR, US',
  });

  // Billing History Invoices Signal
  invoices = signal<InvoiceRecord[]>([
    {
      id: 'inv-1',
      date: '1 Jun 2025',
      description: 'Invento Pro — Monthly',
      amount: '$49.00',
      status: 'Paid',
    },
    {
      id: 'inv-2',
      date: '1 May 2025',
      description: 'Invento Pro — Monthly',
      amount: '$49.00',
      status: 'Paid',
    },
    {
      id: 'inv-3',
      date: '1 Apr 2025',
      description: 'Invento Pro — Monthly',
      amount: '$49.00',
      status: 'Paid',
    },
    {
      id: 'inv-4',
      date: '1 Mar 2025',
      description: 'Invento Pro — Monthly',
      amount: '$49.00',
      status: 'Failed',
    },
    {
      id: 'inv-5',
      date: '4 Mar 2025',
      description: 'Invento Pro — Monthly (retry)',
      amount: '$49.00',
      status: 'Paid',
    },
    {
      id: 'inv-6',
      date: '1 Feb 2025',
      description: 'Invento Starter — Monthly',
      amount: '$19.00',
      status: 'Paid',
    },
  ]);

  // Modal State Signals
  isUpgradeModalOpen = signal<boolean>(false);
  isPaymentModalOpen = signal<boolean>(false);
  notificationMessage = signal<string | null>(null);
  isFadingOut = signal<boolean>(false);

  // Upgrade Actions
  openUpgradeModal() {
    this.isUpgradeModalOpen.set(true);
  }

  closeUpgradeModal() {
    this.isUpgradeModalOpen.set(false);
  }

  onUpgradeModalStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') this.closeUpgradeModal();
  }

  selectPlan(planName: string, price: string) {
    this.plan.update((p) => ({
      ...p,
      name: planName,
      price: price,
    }));
    this.closeUpgradeModal();
    this.showNotification(`Subscription updated to ${planName} (${price}/mo)`);
  }

  cancelSubscription() {
    this.showNotification(
      'Subscription cancellation request logged. You retain Pro access until July 1, 2025.',
    );
  }

  // Payment Modal Actions
  openPaymentModal() {
    this.isPaymentModalOpen.set(true);
  }

  closePaymentModal() {
    this.isPaymentModalOpen.set(false);
  }

  onPaymentModalStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') this.closePaymentModal();
  }

  savePaymentMethod(event: Event) {
    event.preventDefault();
    this.closePaymentModal();
    this.showNotification('Payment method updated successfully!');
  }

  // Invoice Download Action
  downloadInvoice(invoice: InvoiceRecord) {
    this.showNotification(
      `Generating & downloading invoice for ${invoice.date} (${invoice.amount})...`,
    );

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice_${invoice.id.toUpperCase()}_${invoice.date}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; background: #ffffff; max-w: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
          .brand { font-size: 26px; font-weight: 800; color: #4f46e5; tracking-tight: -0.02em; }
          .inv-title { font-size: 18px; font-weight: 700; color: #475569; text-transform: uppercase; }
          .details { display: flex; justify-content: space-between; margin-top: 30px; font-size: 14px; line-height: 1.6; }
          .box { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; width: 45%; }
          .table { width: 100%; margin-top: 30px; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
          .table th { background: #f1f5f9; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #475569; }
          .table td { padding: 16px; border-top: 1px solid #e2e8f0; font-size: 14px; }
          .status { display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; }
          .paid { background: #dcfce7; color: #15803d; }
          .failed { background: #ffe4e6; color: #be123c; }
          .total { margin-top: 25px; text-align: right; font-size: 20px; font-weight: 800; color: #0f172a; }
          .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">INVENTO AI</div>
          <div class="inv-title">INVOICE #${invoice.id.toUpperCase()}</div>
        </div>

        <div class="details">
          <div class="box">
            <strong style="color:#0f172a;">Billed To:</strong><br>
            Clara Morin<br>
            Luminary Goods LLC<br>
            clara@luminarygoods.com<br>
            Portland, OR, US
          </div>
          <div class="box">
            <strong style="color:#0f172a;">Invoice Info:</strong><br>
            Date: <strong>${invoice.date}</strong><br>
            Payment Method: <strong>Visa •••• 4242</strong><br>
            Currency: <strong>USD ($)</strong>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Billing Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${invoice.description}</strong></td>
              <td>${invoice.date}</td>
              <td><strong>${invoice.amount}</strong></td>
              <td>
                <span class="status ${invoice.status === 'Paid' ? 'paid' : 'failed'}">
                  ${invoice.status.toUpperCase()}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="total">
          Total Billed: <span style="color:#4f46e5;">${invoice.amount}</span>
        </div>

        <div class="footer">
          Invento AI Platform — Thank you for your business!<br>
          Need help? Contact support@invento.ai
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          }
        </script>
      </body>
      </html>
    `;

    // 1. Download file directly
    const blob = new Blob([invoiceHtml], { type: 'text/html;charset=utf-8' });
    const fileUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = fileUrl;
    downloadLink.download = `Invento_Invoice_${invoice.id}_${invoice.date.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(fileUrl);

    // 2. Open printable invoice window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
    }
  }

  private showNotification(msg: string) {
    this.isFadingOut.set(false);
    this.notificationMessage.set(msg);
    setTimeout(() => {
      this.isFadingOut.set(true);
      setTimeout(() => {
        this.notificationMessage.set(null);
        this.isFadingOut.set(false);
      }, 350);
    }, 3500);
  }
}
