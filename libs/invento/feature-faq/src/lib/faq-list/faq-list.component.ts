import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGripVertical, lucidePencil, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmSwitchImports } from '@spartan/helm/switch';
import { HlmSheetImports } from '@spartan/helm/sheet';
import { HlmAlertDialogImports } from '@spartan/helm/alert-dialog';
import { FaqStore, type FaqEntry } from '@invento/invento-data-access-faq';
import { FaqFormComponent } from '../faq-form/faq-form.component';

@Component({
  selector: 'app-faq-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DragDropModule,
    NgIcon,
    HlmButtonImports,
    HlmSwitchImports,
    HlmSheetImports,
    HlmAlertDialogImports,
    FaqFormComponent,
  ],
  providers: [provideIcons({ lucideGripVertical, lucidePencil, lucideTrash2 })],
  templateUrl: './faq-list.component.html',
})
export class FaqListComponent {
  protected readonly store = inject(FaqStore);

  protected async onDrop(event: CdkDragDrop<FaqEntry[]>): Promise<void> {
    if (event.previousIndex === event.currentIndex) return;

    const list = [...this.store.entries()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    // Always send the whole list - required so untouched ids don't desync.
    const items = list.map((entry, index) => ({ id: entry.id, position: index }));

    try {
      await this.store.reorder(items);
    } catch {
      // store already rolled back local state and set store.error()
    }
  }

  protected async onTogglePublished(entry: FaqEntry): Promise<void> {
    await this.store.togglePublished(entry);
  }

  protected async onConfirmDelete(id: string): Promise<void> {
    await this.store.delete(id);
  }
}
