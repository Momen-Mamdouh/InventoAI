import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmSheetImports } from '@spartan/helm/sheet';
import { FaqStore } from '@invento/invento-data-access-faq';
import { FaqListComponent } from '../faq-list/faq-list.component';
import { FaqFormComponent } from '../faq-form/faq-form.component';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucidePlus } from '@ng-icons/lucide';

@Component({
  selector: 'app-faq-management-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButtonImports, HlmSheetImports, FaqListComponent, FaqFormComponent, NgIcon],
  providers: [provideIcons({ lucideChevronRight, lucidePlus })],
  templateUrl: './faq-management.page.html',
})
export class FaqManagementPageComponent implements OnInit {
  protected readonly store = inject(FaqStore);

  ngOnInit(): void {
    void this.store.load();
  }
}
