import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { AuthService } from '@invento/shared-data-access-auth';
import { BuilderState } from '@invento/site-builder-data-access-builder';
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
export class Home implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly builderState = inject(BuilderState);

  readonly hasExistingStore = computed(() => {
    if (!this.authService.isLoggedIn()) {
      return false;
    }
    return (
      this.builderState.hasLiveStore() ||
      Boolean(this.authService.currentUser()?.storeSlug ?? this.authService.getStoreSlug())
    );
  });

  ngOnInit(): void {
    if (this.authService.isLoggedIn() && !this.builderState.isHydrated()) {
      this.builderState.hydrateFromBackend().subscribe();
    }
  }
}
