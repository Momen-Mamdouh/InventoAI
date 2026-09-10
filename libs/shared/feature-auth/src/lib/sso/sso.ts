import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AUTH_CONFIG,
  AuthService,
  resolveAuthBasePath,
} from '@invento/shared-data-access-auth';
import { HlmSpinner } from '@spartan/helm/spinner';
import { TranslatePipe } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-sso',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmSpinner, TranslatePipe],
  templateUrl: './sso.html',
  styleUrl: './sso.css',
})
export class Sso implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly config = inject(AUTH_CONFIG);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken') ?? '';
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || this.config.postLoginRoute;

    if (token) {
      this.authService.clearLocalSession();
      this.authService.establishSessionFromTokens(token, refreshToken);

      const target = this.config.resolvePostAuthRoute
        ? this.config.resolvePostAuthRoute(this.authService, returnUrl)
        : returnUrl;

      this.router.navigateByUrl(target, { replaceUrl: true });
    } else {
      const loginPath = `${resolveAuthBasePath(this.config)}/login`;
      this.router.navigate([loginPath], { replaceUrl: true });
    }
  }
}
