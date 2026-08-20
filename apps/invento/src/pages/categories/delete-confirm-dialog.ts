import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrash2 } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmAlertDialogImports } from '@spartan/helm/alert-dialog';
// Same fix as category-form-dialog.ts — import the Brain package directly,
// not the deep node_modules type-declaration path.
import { BrnAlertDialogImports } from '@spartan-ng/brain/alert-dialog';

@Component({
  selector: 'app-delete-confirm-dialog',
  standalone: true,
  imports: [CommonModule, NgIcon, HlmButtonImports, HlmAlertDialogImports, BrnAlertDialogImports],
  providers: [provideIcons({ lucideTrash2 })],
  templateUrl: './delete-confirm-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteConfirmDialog {
  @Input() title = 'Delete item';
  @Input() description?: string;
  @Input() name = '';
  @Output() confirmed = new EventEmitter<void>();
  @Output() canceled = new EventEmitter<void>();

  onStateChanged(state: 'open' | 'closed') {
    if (state === 'closed') this.canceled.emit();
  }
}
