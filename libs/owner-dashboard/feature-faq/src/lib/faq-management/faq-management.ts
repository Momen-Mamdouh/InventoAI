import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucideSearch,
  lucideMessageCircleQuestionMark,
  lucideCheckCircle2,
  lucideClock,
  lucideAlertCircle,
  lucideInfo,
  lucideTag,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { HlmCard } from '@spartan/helm/card';
import { HlmInput } from '@spartan/helm/input';
import { HlmAlert, HlmAlertDescription } from '@spartan/helm/alert';
import {
  HlmSheet,
  HlmSheetContent,
  HlmSheetPortal,
} from '@spartan/helm/sheet';
import {
  HlmSelect,
  HlmSelectContent,
  HlmSelectItem,
  HlmSelectPortal,
  HlmSelectTrigger,
  HlmSelectValue,
} from '@spartan/helm/select';
import { HlmH1, HlmMuted } from '@spartan/helm/typography';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { FaqStore, type FaqEntry } from '@invento/owner-dashboard-data-access-faq';
import { FaqList } from '../faq-list/faq-list';
import { FaqForm } from '../faq-form/faq-form';

@Component({
  selector: 'app-faq-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    NgIcon,
    HlmButton,
    HlmCard,
    HlmInput,
    HlmAlert,
    HlmAlertDescription,
    HlmSheet,
    HlmSheetContent,
    HlmSheetPortal,
    HlmSelect,
    HlmSelectContent,
    HlmSelectItem,
    HlmSelectPortal,
    HlmSelectTrigger,
    HlmSelectValue,
    HlmH1,
    HlmMuted,
    TranslatePipe,
    FaqList,
    FaqForm,
  ],
  providers: [
    provideIcons({
      lucidePlus,
      lucideSearch,
      lucideMessageCircleQuestionMark,
      lucideCheckCircle2,
      lucideClock,
      lucideAlertCircle,
      lucideInfo,
      lucideTag,
    }),
  ],
  templateUrl: './faq-management.html',
  styleUrl: './faq-management.css',
})
export class FaqManagement implements OnInit, OnDestroy {
  readonly store = inject(FaqStore);
  private readonly localeService = inject(LocaleService);

  readonly isDrawerOpen = signal<boolean>(false);
  readonly editingEntry = signal<FaqEntry | null>(null);

  protected readonly sheetSide = computed<'left' | 'right'>(() =>
    this.localeService.isRtl() ? 'left' : 'right',
  );

  readonly availableCategories = computed<string[]>(() => {
    const list = this.store.categories();
    const set = new Set<string>(['general', 'orders', 'shipping', 'payments', 'returns', 'support', ...list]);
    return Array.from(set);
  });

  private readonly searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  readonly statusItemToString = (value: unknown): string => {
    const str = String(value);
    const key = `faq.filter_${str.toLowerCase()}`;
    const translated = this.localeService.translate(key);
    return translated && translated !== key ? translated : str;
  };

  readonly categoryItemToString = (value: unknown): string => {
    const str = String(value);
    if (str === 'all') {
      return this.localeService.translate('faq.filter_all_categories');
    }
    const key = `faq.category_${str.toLowerCase()}`;
    const translated = this.localeService.translate(key);
    return translated && translated !== key ? translated : (str.charAt(0).toUpperCase() + str.slice(1));
  };

  getCategoryLabel(category: string): string {
    const key = `faq.category_${category.toLowerCase()}`;
    const translated = this.localeService.translate(key);
    return translated && translated !== key ? translated : (category.charAt(0).toUpperCase() + category.slice(1));
  }

  ngOnInit(): void {
    void this.store.load();

    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        this.store.setSearchQuery(query);
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  onSearchInput(value: string | Event): void {
    const query = typeof value === 'string' ? value : (value.target as HTMLInputElement).value;
    this.searchSubject.next(query);
  }

  onStatusFilterChange(status: string | null | undefined): void {
    this.store.setStatusFilter((status as 'all' | 'published' | 'draft') ?? 'all');
  }

  onCategoryFilterChange(category: string | null | undefined): void {
    this.store.setCategoryFilter(category ?? 'all');
  }

  openCreateDrawer(): void {
    if (this.store.isFull()) {
      return;
    }
    this.editingEntry.set(null);
    this.isDrawerOpen.set(true);
  }

  openEditDrawer(entry: FaqEntry): void {
    this.editingEntry.set(entry);
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
    this.editingEntry.set(null);
  }

  onDrawerStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') {
      this.closeDrawer();
    }
  }
}
