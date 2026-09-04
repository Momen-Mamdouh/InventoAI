import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmTypographyImports } from '@spartan/helm/typography';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, HlmTypographyImports],
})
export class EmptyState {
  public readonly icon = input<string>('lucideInbox');
  public readonly title = input<string>('No data found');
  public readonly description = input<string>('');
}
