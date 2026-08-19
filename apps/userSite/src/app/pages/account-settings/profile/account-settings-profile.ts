import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmTypographyImports } from '@spartan/helm/typography';
import { AuthService } from '@invento/user-site/app/core/service/auth.service';

@Component({
  selector: 'app-account-settings-profile',
  standalone: true,
  imports: [
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmCardImports,
    HlmTypographyImports,
  ],
  templateUrl: './account-settings-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsProfileComponent {
  // NOTE: The backend has no `GET /users/me` / `PATCH /users/me` endpoint (verified against
  // BACKEND/src/users). Until one exists this tab is read-only: it mirrors `currentUser` (hydrated
  // from localStorage by AuthService, so it can briefly be null during SSR/first render — hence the
  // `@if` guard in the template) and there is no save action to wire up.
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;

  readonly initials = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    const f = user.firstName?.[0] ?? '';
    const l = user.lastName?.[0] ?? '';
    return `${f}${l}`.toUpperCase();
  });
}
