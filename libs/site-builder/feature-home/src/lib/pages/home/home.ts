import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '@invento/shared-data-access-auth';
import { Hero } from '../../home-components/hero/hero';
import { Stats } from '../../home-components/stats/stats';
import { Pipeline } from '../../home-components/pipeline/pipeline';
import { Capabilities } from '../../home-components/capabilities/capabilities';
import { Cta } from '../../home-components/cta/cta';
import { ExistingStore } from '../../home-components/existing-store/existing-store';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Hero, Stats, Pipeline, Capabilities, Cta, ExistingStore],
})
export class Home {
  private readonly authService = inject(AuthService);

  readonly hasExistingStore = computed(() => {
    if (!this.authService.isLoggedIn()) {
      return false;
    }
    const user = this.authService.currentUser();
    return Boolean(user?.storeSlug ?? this.authService.getStoreSlug());
  });
}
