import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toast } from '@spartan/helm/sonner';
import { extractErrorMessage } from '@invento/shared-util-error';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideDownload,
  lucideSearch,
  lucideChevronRight,
  lucidePlus,
  lucideX,
  lucideAlertCircle,
  lucideLoader2,
  lucideTags,
  lucideTrash2,
  lucideEdit,
  lucideSettings2,
  lucideGripVertical,
  lucideRefreshCw,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmButton } from '@spartan/helm/button';
import { HlmCheckbox } from '@spartan/helm/checkbox';
import { HlmCard } from '@spartan/helm/card';
import { HlmInput } from '@spartan/helm/input';
import {
  HlmSelect,
  HlmSelectContent,
  HlmSelectItem,
  HlmSelectPortal,
  HlmSelectTrigger,
  HlmSelectValue,
} from '@spartan/helm/select';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import {
  HlmTable,
  HlmTBody,
  HlmTd,
  HlmTh,
  HlmTHead,
  HlmTr,
} from '@spartan/helm/table';
import {
  HlmSheet,
  HlmSheetContent,
  HlmSheetFooter,
  HlmSheetHeader,
  HlmSheetPortal,
  HlmSheetTitle,
} from '@spartan/helm/sheet';
import { HlmLabel } from '@spartan/helm/label';
import { HlmH1, HlmMuted, HlmSmall } from '@spartan/helm/typography';
import { HlmTooltip } from '@spartan/helm/tooltip';
import { HlmAlert, HlmAlertDescription } from '@spartan/helm/alert';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';

import {
  AttributeDisplayStyle,
  AttributeService,
  ProductAttribute,
  ProductAttributeValue,
} from '@invento/owner-dashboard-data-access-attribute';
import { AttributeSearchPipe } from './attribute-search.pipe';
import { DeleteConfirmDialog } from '@invento/owner-dashboard-ui-confirm-dialog';
import { EmptyState } from '@invento/shared-ui-empty-state';

@Component({
  selector: 'app-attributes',
  imports: [
    FormsModule,
    NgIcon,
    HlmBadge,
    HlmButton,
    HlmCard,
    HlmInput,
    HlmSelect,
    HlmSelectTrigger,
    HlmSelectValue,
    HlmSelectContent,
    HlmSelectItem,
    HlmSelectPortal,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    AttributeSearchPipe,
    DeleteConfirmDialog,
    HlmSkeleton,
    HlmTable,
    HlmTHead,
    HlmTBody,
    HlmTr,
    HlmTh,
    HlmTd,
    HlmSheet,
    HlmSheetHeader,
    HlmSheetTitle,
    HlmSheetContent,
    HlmSheetFooter,
    HlmSheetPortal,
    HlmLabel,
    HlmH1,
    HlmMuted,
    HlmSmall,
    HlmTooltip,
    HlmAlert,
    HlmAlertDescription,
    TranslatePipe,
    HlmCheckbox,
    EmptyState,
  ],
  providers: [
    provideIcons({
      lucideDownload,
      lucideSearch,
      lucideChevronRight,
      lucidePlus,
      lucideX,
      lucideAlertCircle,
      lucideLoader2,
      lucideTags,
      lucideTrash2,
      lucideEdit,
      lucideSettings2,
      lucideGripVertical,
      lucideRefreshCw,
    }),
  ],
  templateUrl: './attributes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Attributes implements OnInit {
  private readonly attributeService = inject(AttributeService);
  private readonly localeService = inject(LocaleService);

  readonly attributes = signal<ProductAttribute[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly searchQuery = signal('');

  // Loading states for actions
  readonly isSaving = signal<boolean>(false);
  readonly isAddingValue = signal<boolean>(false);

  // Attribute Drawer State
  readonly isAttributeDrawerOpen = signal(false);
  readonly editingAttribute = signal<ProductAttribute | null>(null);

  // Attribute Form Models
  attrName = signal('');
  attrKey = signal('');
  attrStyle = signal<AttributeDisplayStyle>(AttributeDisplayStyle.List);
  attrIsFilterable = signal(true);
  attrShowOnProductPage = signal(true);

  readonly styleItemToString = (value: unknown): string => {
    const key = String(value).toLowerCase();
    return this.localeService.translate(`attributes.style_${key}`);
  };

  // Values Drawer State
  readonly isValuesDrawerOpen = signal(false);
  readonly activeAttributeForValues = signal<ProductAttribute | null>(null);

  // Value Form Models
  newValueName = signal('');
  newValueSlug = signal('');

  // Delete Modal State
  readonly isDeleteAttributeModalOpen = signal(false);
  readonly attributeToDelete = signal<ProductAttribute | null>(null);

  readonly isDeleteValueModalOpen = signal(false);
  readonly valueToDelete = signal<{ attrId: string; valueId: string; name: string } | null>(null);

  ngOnInit(): void {
    this.fetchAttributes();
  }

  fetchAttributes(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.attributeService.getAttributes().subscribe({
      next: (data: ProductAttribute[]) => {
        this.attributes.set(data);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error('Failed to load attributes', err);
        this.errorMessage.set(
          extractErrorMessage(err, this.localeService.translate('attributes.error_fetch_failed')),
        );
        this.isLoading.set(false);
      },
    });
  }

  // --- Attribute CRUD ---

  openAddAttributeDrawer(): void {
    this.editingAttribute.set(null);
    this.attrName.set('');
    this.attrKey.set('');
    this.attrStyle.set(AttributeDisplayStyle.List);
    this.attrIsFilterable.set(true);
    this.attrShowOnProductPage.set(true);
    this.isAttributeDrawerOpen.set(true);
  }

  openEditAttributeDrawer(attr: ProductAttribute): void {
    this.editingAttribute.set(attr);
    this.attrName.set(attr.name);
    this.attrKey.set(attr.key);
    this.attrStyle.set(attr.displayStyle as AttributeDisplayStyle);
    this.attrIsFilterable.set(attr.isFilterable);
    this.attrShowOnProductPage.set(attr.showOnProductPage);
    this.isAttributeDrawerOpen.set(true);
  }

  closeAttributeDrawer(): void {
    this.isAttributeDrawerOpen.set(false);
  }

  onAttributeDrawerStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') {
      this.closeAttributeDrawer();
    }
  }

  saveAttribute(): void {
    const name = this.attrName().trim();
    if (!name) {
      toast.error(this.localeService.translate('attributes.toast_name_required'));
      return;
    }

    this.isSaving.set(true);
    const isEdit = this.editingAttribute();

    if (isEdit) {
      this.attributeService
        .updateAttribute(isEdit.id, {
          name,
          key: this.attrKey().trim() || undefined,
          displayStyle: this.attrStyle(),
          isFilterable: this.attrIsFilterable(),
          showOnProductPage: this.attrShowOnProductPage(),
        })
        .subscribe({
          next: () => {
            this.isSaving.set(false);
            this.fetchAttributes();
            this.closeAttributeDrawer();
            toast.success(this.localeService.translate('attributes.toast_updated'));
          },
          error: (err: unknown) => {
            this.isSaving.set(false);
            console.error('Failed to update attribute', err);
            toast.error(
              extractErrorMessage(
                err,
                this.localeService.translate('attributes.toast_update_error'),
              ),
            );
          },
        });
    } else {
      this.attributeService
        .createAttribute({
          name,
          key: this.attrKey().trim() || undefined,
          displayStyle: this.attrStyle(),
          isFilterable: this.attrIsFilterable(),
          showOnProductPage: this.attrShowOnProductPage(),
          isVariantAxis: false,
        })
        .subscribe({
          next: () => {
            this.isSaving.set(false);
            this.fetchAttributes();
            this.closeAttributeDrawer();
            toast.success(this.localeService.translate('attributes.toast_created'));
          },
          error: (err: unknown) => {
            this.isSaving.set(false);
            console.error('Failed to create attribute', err);
            toast.error(
              extractErrorMessage(
                err,
                this.localeService.translate('attributes.toast_create_error'),
              ),
            );
          },
        });
    }
  }

  deleteAttribute(attr: ProductAttribute): void {
    this.attributeToDelete.set(attr);
    this.isDeleteAttributeModalOpen.set(true);
  }

  confirmDeleteAttribute(): void {
    const attr = this.attributeToDelete();
    if (!attr) return;

    this.attributeService.deleteAttribute(attr.id).subscribe({
      next: () => {
        this.fetchAttributes();
        this.isDeleteAttributeModalOpen.set(false);
        this.attributeToDelete.set(null);
        toast.success(this.localeService.translate('attributes.toast_deleted'));
      },
      error: (err: { status?: number; error?: { message?: string } }) => {
        console.error('Failed to delete attribute', err);
        this.isDeleteAttributeModalOpen.set(false);

        if (err.status === 409) {
          toast.error(
            err.error?.message ||
              this.localeService.translate('attributes.toast_delete_in_use'),
          );
        } else {
          toast.error(
            extractErrorMessage(
              err,
              this.localeService.translate('attributes.toast_delete_error'),
            ),
          );
        }
      },
    });
  }

  cancelDeleteAttribute(): void {
    this.isDeleteAttributeModalOpen.set(false);
    this.attributeToDelete.set(null);
  }

  // --- Value CRUD ---

  openValuesDrawer(attr: ProductAttribute): void {
    this.activeAttributeForValues.set(attr);
    this.newValueName.set('');
    this.newValueSlug.set('');
    this.isValuesDrawerOpen.set(true);
  }

  closeValuesDrawer(): void {
    this.isValuesDrawerOpen.set(false);
    this.activeAttributeForValues.set(null);
  }

  onValuesDrawerStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') {
      this.closeValuesDrawer();
    }
  }

  addValue(): void {
    const attr = this.activeAttributeForValues();
    if (!attr) return;

    const valName = this.newValueName().trim();
    if (!valName) {
      toast.error(this.localeService.translate('attributes.toast_value_name_required'));
      return;
    }

    this.isAddingValue.set(true);

    this.attributeService
      .addAttributeValue(attr.id, {
        value: valName,
        slug: this.newValueSlug().trim() || undefined,
      })
      .subscribe({
        next: (updatedAttr) => {
          this.isAddingValue.set(false);
          this.activeAttributeForValues.set(updatedAttr);
          this.newValueName.set('');
          this.newValueSlug.set('');
          this.fetchAttributes();
          toast.success(this.localeService.translate('attributes.toast_value_added'));
        },
        error: (err: unknown) => {
          this.isAddingValue.set(false);
          console.error('Failed to add value', err);
          toast.error(
            extractErrorMessage(
              err,
              this.localeService.translate('attributes.toast_value_add_error'),
            ),
          );
        },
      });
  }

  deleteValue(val: ProductAttributeValue): void {
    const attr = this.activeAttributeForValues();
    if (!attr) return;

    this.valueToDelete.set({ attrId: attr.id, valueId: val.id, name: val.value });
    this.isDeleteValueModalOpen.set(true);
  }

  confirmDeleteValue(): void {
    const toDelete = this.valueToDelete();
    if (!toDelete) return;

    this.attributeService.deleteAttributeValue(toDelete.attrId, toDelete.valueId).subscribe({
      next: () => {
        this.attributeService.getAttributes().subscribe((attrs) => {
          this.attributes.set(attrs);
          const updatedAttr = attrs.find((a) => a.id === toDelete.attrId) || null;
          this.activeAttributeForValues.set(updatedAttr);
          this.isDeleteValueModalOpen.set(false);
          this.valueToDelete.set(null);
          toast.success(this.localeService.translate('attributes.toast_value_deleted'));
        });
      },
      error: (err: { status?: number; error?: { message?: string } }) => {
        console.error('Failed to delete value', err);
        this.isDeleteValueModalOpen.set(false);
        if (err.status === 409) {
          toast.error(
            err.error?.message ||
              this.localeService.translate('attributes.toast_value_delete_in_use'),
          );
        } else {
          toast.error(
            extractErrorMessage(
              err,
              this.localeService.translate('attributes.toast_value_delete_error'),
            ),
          );
        }
      },
    });
  }

  cancelDeleteValue(): void {
    this.isDeleteValueModalOpen.set(false);
    this.valueToDelete.set(null);
  }

  dropAttribute(event: CdkDragDrop<ProductAttribute[]>): void {
    const previousList = [...this.attributes()];
    const currentList = [...this.attributes()];
    moveItemInArray(currentList, event.previousIndex, event.currentIndex);
    this.attributes.set(currentList);

    const reorderItems = currentList.map((attr, index) => ({ id: attr.id, position: index }));
    this.attributeService.reorderAttributes({ items: reorderItems }).subscribe({
      next: (updatedAttrs) => this.attributes.set(updatedAttrs),
      error: (err: unknown) => {
        console.error('Failed to reorder attributes', err);
        this.attributes.set(previousList);
        toast.error(this.localeService.translate('attributes.toast_reorder_error'));
      },
    });
  }

  dropValue(event: CdkDragDrop<ProductAttributeValue[]>): void {
    const attr = this.activeAttributeForValues();
    if (!attr) return;

    const previousValues = [...attr.values];
    const currentValues = [...attr.values];
    moveItemInArray(currentValues, event.previousIndex, event.currentIndex);
    const updatedAttr = { ...attr, values: currentValues };
    this.activeAttributeForValues.set(updatedAttr);

    const reorderItems = currentValues.map((val, index) => ({ id: val.id, position: index }));
    this.attributeService.reorderAttributeValues(attr.id, { items: reorderItems }).subscribe({
      next: (savedAttr) => {
        this.activeAttributeForValues.set(savedAttr);
        this.fetchAttributes();
      },
      error: (err: unknown) => {
        console.error('Failed to reorder values', err);
        this.activeAttributeForValues.set({ ...attr, values: previousValues });
        toast.error(this.localeService.translate('attributes.toast_reorder_error'));
      },
    });
  }
}
