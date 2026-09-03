import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmSheetImports } from '@spartan/helm/sheet';
import { HlmH1, HlmMuted } from '@spartan/helm/typography';
import { FaqStore } from '@invento/owner-dashboard-data-access-faq';
import { FaqList } from '../faq-list/faq-list';
import { FaqForm } from '../faq-form/faq-form';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucidePlus } from '@ng-icons/lucide';

@Component({
  selector: 'app-faq-management-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HlmButtonImports,
    HlmSheetImports,
    FaqList,
    FaqForm,
    NgIcon,
    HlmH1,
    HlmMuted,
  ],
  providers: [provideIcons({ lucideChevronRight, lucidePlus })],
  templateUrl: './faq-management.page.html',
})
export class FaqManagementPage implements OnInit {
  protected readonly store = inject(FaqStore);

  ngOnInit(): void {
    void this.store.load();
  }
}
