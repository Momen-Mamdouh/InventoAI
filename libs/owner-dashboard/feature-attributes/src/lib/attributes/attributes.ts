import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toast } from '@spartan/helm/sonner';
import { extractErrorMessage } from '@invento/shared-util-error';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
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
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan/helm/badge';
import { HlmButton } from '@spartan/helm/button';
import { HlmCheckboxImports } from '@spartan/helm/checkbox';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmSelectImports } from '@spartan/helm/select';
import { HlmSkeleton } from '@spartan/helm/skeleton';
import { HlmTableImports } from '@spartan/helm/table';
import { HlmSheetImports } from '@spartan/helm/sheet';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmH1, HlmMuted, HlmSmall } from '@spartan/helm/typography';
import { HlmTooltipImports } from '@spartan/helm/tooltip';
import { TranslatePipe } from '@invento/shared-util-i18n';

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
    HlmCardImports,
    HlmInputImports,
    HlmSelectImports,
    DragDropModule,
    AttributeSearchPipe,
    DeleteConfirmDialog,
    HlmSkeleton,
    HlmTableImports,
    HlmSheetImports,
    HlmLabelImports,
    HlmH1,
    HlmMuted,
    HlmSmall,
    HlmTooltipImports,
    TranslatePipe,
    HlmCheckboxImports,
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
    }),
  ],
  templateUrl: './attributes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Attributes implements OnInit {
  private readonly attributeService = inject(AttributeService);

  readonly attributes = signal<ProductAttribute[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly searchQuery = signal('');

  // Attribute Drawer State
  readonly isAttributeDrawerOpen = signal(false);
  readonly editingAttribute = signal<ProductAttribute | null>(null);

  // Attribute Form Models
  attrName = signal('');
  attrKey = signal('');
  attrStyle = signal<AttributeDisplayStyle>(AttributeDisplayStyle.List);
  attrIsFilterable = signal(true);
  attrShowOnProductPage = signal(true);

  private readonly styleLabels: Record<string, string> = {
    list: 'List',
    dropdown: 'Dropdown',
    swatch: 'Swatch',
    chip: 'Chip',
  };

  readonly styleItemToString = (value: unknown): string => {
    return this.styleLabels[String(value).toLowerCase()] ?? 'List';
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

    this.attributeService.getAttributes().subscribe({
      next: (data: ProductAttribute[]) => {
        this.attributes.set(data);
        this.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error('Failed to load attributes', err);
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
    if (state === 'closed') this.closeAttributeDrawer();
  }

  saveAttribute(): void {
    const isEdit = this.editingAttribute();

    if (isEdit) {
      this.attributeService
        .updateAttribute(isEdit.id, {
          name: this.attrName(),
          key: this.attrKey(),
          displayStyle: this.attrStyle(),
          isFilterable: this.attrIsFilterable(),
          showOnProductPage: this.attrShowOnProductPage(),
        })
        .subscribe({
          next: () => {
            this.fetchAttributes();
            this.closeAttributeDrawer();
          },
          error: (err) => console.error('Failed to update attribute', err),
        });
    } else {
      this.attributeService
        .createAttribute({
          name: this.attrName(),
          key: this.attrKey() || undefined,
          displayStyle: this.attrStyle(),
          isFilterable: this.attrIsFilterable(),
          showOnProductPage: this.attrShowOnProductPage(),
          isVariantAxis: false,
        })
        .subscribe({
          next: () => {
            this.fetchAttributes();
            this.closeAttributeDrawer();
          },
          error: (err) => console.error('Failed to create attribute', err),
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
        toast.success('Attribute deleted successfully');
      },
      error: (err) => {
        console.error('Failed to delete attribute', err);
        this.isDeleteAttributeModalOpen.set(false);

        if (err.status === 409) {
          toast.error(err.error?.message || 'Cannot delete this attribute because it is in use.');
        } else {
          toast.error(extractErrorMessage(err, 'Failed to delete attribute'));
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
    if (state === 'closed') this.closeValuesDrawer();
  }

  addValue(): void {
    const attr = this.activeAttributeForValues();
    if (!attr) return;

    this.attributeService
      .addAttributeValue(attr.id, {
        value: this.newValueName(),
        slug: this.newValueSlug() || undefined,
      })
      .subscribe({
        next: (updatedAttr) => {
          this.activeAttributeForValues.set(updatedAttr);
          this.newValueName.set('');
          this.newValueSlug.set('');
          this.fetchAttributes();
        },
        error: (err) => console.error('Failed to add value', err),
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
          toast.success('Value deleted successfully');
        });
      },
      error: (err) => {
        console.error('Failed to delete value', err);
        this.isDeleteValueModalOpen.set(false);
        if (err.status === 409) {
          toast.error(err.error?.message || 'Cannot delete this value because it is in use.');
        } else {
          toast.error(extractErrorMessage(err, 'Failed to delete value'));
        }
      },
    });
  }

  cancelDeleteValue(): void {
    this.isDeleteValueModalOpen.set(false);
    this.valueToDelete.set(null);
  }

  dropAttribute(event: CdkDragDrop<ProductAttribute[]>): void {
    const currentList = [...this.attributes()];
    moveItemInArray(currentList, event.previousIndex, event.currentIndex);
    this.attributes.set(currentList);

    const reorderItems = currentList.map((attr, index) => ({ id: attr.id, position: index }));
    this.attributeService.reorderAttributes({ items: reorderItems }).subscribe({
      next: (updatedAttrs) => this.attributes.set(updatedAttrs),
      error: (err) => console.error('Failed to reorder attributes', err),
    });
  }

  dropValue(event: CdkDragDrop<ProductAttributeValue[]>): void {
    const attr = this.activeAttributeForValues();
    if (!attr) return;

    const currentValues = [...attr.values];
    moveItemInArray(currentValues, event.previousIndex, event.currentIndex);
    attr.values = currentValues;
    this.activeAttributeForValues.set(attr);

    const reorderItems = currentValues.map((val, index) => ({ id: val.id, position: index }));
    this.attributeService.reorderAttributeValues(attr.id, { items: reorderItems }).subscribe({
      next: (updatedAttr) => {
        this.activeAttributeForValues.set(updatedAttr);
        this.fetchAttributes();
      },
      error: (err) => console.error('Failed to reorder values', err),
    });
  }
}
