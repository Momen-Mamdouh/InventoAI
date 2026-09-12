import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideInbox,
  lucideSearch,
  lucidePackageOpen,
  lucideFolderOpen,
  lucideAlertCircle,
  lucideShoppingBag,
  lucideFileQuestion,
} from '@ng-icons/lucide';
import { HlmTypographyImports } from '@spartan/helm/typography';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, HlmTypographyImports],
  providers: [
    provideIcons({
      lucideInbox,
      lucideSearch,
      lucidePackageOpen,
      lucideFolderOpen,
      lucideAlertCircle,
      lucideShoppingBag,
      lucideFileQuestion,
    }),
  ],
})
export class EmptyState {
  public readonly icon = input<string>('lucideInbox');
  public readonly title = input<string>('No data found');
  public readonly description = input<string>('');
}
