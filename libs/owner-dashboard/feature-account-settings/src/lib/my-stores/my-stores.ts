import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideZap,
  lucidePencil,
  lucideStore,
  lucideExternalLink,
  lucideClock,
  lucideCheck,
  lucideTrash2,
  lucideX,
  lucideChevronRight,
  lucideChevronDown,
  lucideUser,
  lucideShield,
  lucideBell,
  lucideCreditCard,
  lucideAlertTriangle,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmCard } from '@spartan/helm/card';
import { HlmButton } from '@spartan/helm/button';
import { HlmInput } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmSelectImports } from '@spartan/helm/select';
import { HlmDialogImports } from '@spartan/helm/dialog';
import { HlmAlertDialogImports } from '@spartan/helm/alert-dialog';
// Brain primitives are the plain npm package — not re-exported through the
// project's `@spartan/helm` alias, so import them directly (see category-form-dialog.ts).
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { BrnAlertDialogImports } from '@spartan-ng/brain/alert-dialog';
import { HlmH1, HlmH3, HlmMuted } from '@spartan/helm/typography';
import { HlmTooltipImports } from '@spartan/helm/tooltip';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { StoreService } from '@invento/owner-dashboard-data-access-store';

export interface StoreItem {
  id: string;
  name: string;
  slug: string;
  status: 'Live' | 'Draft' | 'Maintenance';
  description: string;
  storeUrl: string;
  createdAt: string;
  image: string;
}

@Component({
  selector: 'app-my-stores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NgIcon,
    HlmBadge,
    HlmCard,
    HlmButton,
    HlmInput,
    HlmLabelImports,
    HlmSelectImports,
    HlmDialogImports,
    HlmAlertDialogImports,
    BrnDialogImports,
    BrnAlertDialogImports,
    HlmH1,
    HlmH3,
    HlmMuted,
    HlmTooltipImports,
    HlmSkeleton,
  ],
  providers: [
    provideIcons({
      lucideZap,
      lucidePencil,
      lucideStore,
      lucideExternalLink,
      lucideClock,
      lucideCheck,
      lucideTrash2,
      lucideX,
      lucideChevronRight,
      lucideChevronDown,
      lucideUser,
      lucideShield,
      lucideBell,
      lucideCreditCard,
      lucideAlertTriangle,
    }),
  ],
  templateUrl: './my-stores.html',
  styleUrl: './my-stores.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyStores {
  private readonly router = inject(Router);
  private readonly storeService = inject(StoreService);

  readonly loading = signal<boolean>(true);
  readonly hasStore = signal<boolean>(false);

  // Stores Data List
  stores = signal<StoreItem[]>([]);

  constructor() {
    this.fetchStore();
  }

  private fetchStore(): void {
    this.loading.set(true);
    this.storeService.getMyStore().subscribe({
      next: (store) => {
        this.loading.set(false);
        this.hasStore.set(true);
        const formattedDate = new Date(store.createdAt).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const statusMap = store.status?.toLowerCase() === 'live' ? 'Live' : 'Draft';
        const storeUrl =
          typeof window !== 'undefined' && window.location.hostname !== 'localhost'
            ? `${window.location.protocol}//${window.location.host}/${store.slug}`
            : `http://localhost:4300/${store.slug}`;

        this.stores.set([
          {
            id: store.id,
            name: store.name,
            slug: store.slug,
            status: statusMap,
            description: store.description || 'E-commerce store powered by Invento',
            storeUrl,
            createdAt: formattedDate,
            image:
              store.heroImageUrl ||
              'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
          },
        ]);
      },
      error: () => {
        this.loading.set(false);
        this.hasStore.set(false);
        this.stores.set([]);
      },
    });
  }

  // Modal State Signals
  isModalOpen = signal<boolean>(false);
  editingStoreId = signal<string | null>(null);
  notificationMessage = signal<string | null>(null);
  isFadingOut = signal<boolean>(false);

  // Delete Confirmation Modal Signals
  isDeleteModalOpen = signal<boolean>(false);
  storeToDelete = signal<StoreItem | null>(null);

  // Form Signals
  formName = signal<string>('');
  formDescription = signal<string>('');
  formSlug = signal<string>('');
  formStatus = signal<'Live' | 'Draft' | 'Maintenance'>('Live');
  formImage = signal<string>('');

  readonly statusItemToString = (value: unknown): string => {
    return String(value) || 'Live';
  };

  // Actions
  openCreateModal() {
    this.editingStoreId.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.formSlug.set('');
    this.formStatus.set('Live');
    this.formImage.set(
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
    );
    this.isModalOpen.set(true);
  }

  openEditModal(store: StoreItem) {
    this.editingStoreId.set(store.id);
    this.formName.set(store.name);
    this.formDescription.set(store.description);
    this.formSlug.set(store.slug);
    this.formStatus.set(store.status);
    this.formImage.set(store.image);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingStoreId.set(null);
  }

  onModalStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') this.closeModal();
  }

  saveStoreForm(event: Event) {
    event.preventDefault();
    const name = this.formName().trim();
    if (!name) return;

    if (this.editingStoreId()) {
      // Edit existing store
      this.stores.update((items) =>
        items.map((s) =>
          s.id === this.editingStoreId()
            ? {
                ...s,
                name: this.formName(),
                description: this.formDescription() || 'E-commerce store',
                status: this.formStatus(),
                image: this.formImage() || s.image,
              }
            : s,
        ),
      );
      this.showNotification(`Store "${name}" updated.`);
    }

    this.closeModal();
  }

  // Delete confirmation flow
  confirmDeleteStore(store: StoreItem) {
    this.storeToDelete.set(store);
    this.isDeleteModalOpen.set(true);
  }

  cancelDeleteStore() {
    this.isDeleteModalOpen.set(false);
    this.storeToDelete.set(null);
  }

  onDeleteModalStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') this.cancelDeleteStore();
  }

  executeDeleteStore() {
    const target = this.storeToDelete();
    if (target) {
      this.stores.update((items) => items.filter((s) => s.id !== target.id));
      this.showNotification(`Store "${target.name}" deleted.`);
    }
    this.cancelDeleteStore();
  }

  manageStore(store: StoreItem) {
    this.showNotification(`Now managing "${store.name}". Navigating to store dashboard...`);
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 1200);
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
