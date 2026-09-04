import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmSpinnerImports } from '@spartan/helm/spinner';
import { lucideImage, lucideTrash2, lucideUpload } from '@ng-icons/lucide';
import { provideIcons, NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, HlmButtonImports, HlmSpinnerImports, NgIcon],
  providers: [provideIcons({ lucideUpload, lucideTrash2, lucideImage })],
  templateUrl: './image-upload.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUpload {
  @Input() imageUrl: string | null = null;
  /** True while an upload/remove request to the backend is in flight. */
  @Input() busy = false;
  @Output() upload = new EventEmitter<File>();
  @Output() remove = new EventEmitter<void>();

  onFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (f) this.upload.emit(f);
    input.value = ''; // allow re-selecting the same file consecutively
  }
}
