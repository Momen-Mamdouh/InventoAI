import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideGripVertical,
  lucidePencil,
  lucideTrash2,
  lucideChevronDown,
  lucideChevronUp,
  lucideMessageCircleQuestionMark,
  lucideBan,
  lucideX,
  lucideAlertCircle,
  lucideInfo,
  lucidePackage,
  lucideTruck,
  lucideCreditCard,
  lucideShield,
  lucideHeadphones,
  lucideHelpCircle,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmSwitch } from '@spartan/helm/switch';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { HlmSpinner } from '@spartan/helm/spinner';
import {
  HlmAlertDialog,
  HlmAlertDialogContent,
} from '@spartan/helm/alert-dialog';
import { BrnAlertDialogContent } from '@spartan-ng/brain/alert-dialog';
import { HlmMuted } from '@spartan/helm/typography';
import { EmptyState } from '@invento/shared-ui-empty-state';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { FaqStore, type FaqEntry } from '@invento/owner-dashboard-data-access-faq';

@Component({
  selector: 'app-faq-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DragDropModule,
    NgIcon,
    HlmButton,
    HlmBadge,
    HlmSwitch,
    HlmSkeleton,
    HlmSpinner,
    HlmAlertDialog,
    HlmAlertDialogContent,
    BrnAlertDialogContent,
    HlmMuted,
    EmptyState,
    TranslatePipe,
  ],
  providers: [
    provideIcons({
      lucideGripVertical,
      lucidePencil,
      lucideTrash2,
      lucideChevronDown,
      lucideChevronUp,
      lucideMessageCircleQuestionMark,
      lucideBan,
      lucideX,
      lucideAlertCircle,
      lucideInfo,
      lucidePackage,
      lucideTruck,
      lucideCreditCard,
      lucideShield,
      lucideHeadphones,
      lucideHelpCircle,
    }),
  ],
  templateUrl: './faq-list.html',
})
export class FaqList {
  readonly store = inject(FaqStore);
  private readonly localeService = inject(LocaleService);
  readonly edit = output<FaqEntry>();
  readonly createNew = output<void>();

  readonly expandedEntryIds = signal<Set<string>>(new Set());
  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly entryToDelete = signal<FaqEntry | null>(null);
  readonly isDeleting = signal<boolean>(false);

  getCategoryIcon(category?: string): string {
    const cat = category?.trim().toLowerCase();
    switch (cat) {
      case 'orders':
        return 'lucidePackage';
      case 'shipping':
        return 'lucideTruck';
      case 'payments':
        return 'lucideCreditCard';
      case 'returns':
        return 'lucideShield';
      case 'support':
        return 'lucideHeadphones';
      default:
        return 'lucideHelpCircle';
    }
  }

  getCategoryLabel(category?: string): string {
    const cat = category?.trim().toLowerCase() || 'general';
    const key = `faq.category_${cat}`;
    const translated = this.localeService.translate(key);
    return translated !== key ? translated : (category || 'General');
  }

  toggleExpand(id: string): void {
    this.expandedEntryIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isExpanded(id: string): boolean {
    return this.expandedEntryIds().has(id);
  }

  async onDrop(event: CdkDragDrop<FaqEntry[]>): Promise<void> {
    if (this.store.isFiltering()) {
      return;
    }

    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const list = [...this.store.entries()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    const items = list.map((entry, index) => ({ id: entry.id, position: index }));

    try {
      await this.store.reorder(items);
    } catch {
      // Store rolls back local state and sets error notification
    }
  }

  async onTogglePublished(entry: FaqEntry): Promise<void> {
    await this.store.togglePublished(entry);
  }

  onEdit(entry: FaqEntry): void {
    this.edit.emit(entry);
  }

  openDeleteDialog(entry: FaqEntry): void {
    this.entryToDelete.set(entry);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteDialog(): void {
    this.isDeleteModalOpen.set(false);
    this.entryToDelete.set(null);
  }

  onDeleteModalStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') {
      this.closeDeleteDialog();
    }
  }

  async onConfirmDelete(): Promise<void> {
    const entry = this.entryToDelete();
    if (!entry) {
      return;
    }

    this.isDeleting.set(true);
    try {
      await this.store.delete(entry.id);
      this.closeDeleteDialog();
    } finally {
      this.isDeleting.set(false);
    }
  }
}
