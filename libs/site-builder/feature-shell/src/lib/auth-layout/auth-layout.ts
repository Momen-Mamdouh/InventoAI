import { TranslatePipe } from '@invento/shared-util-i18n';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DriftWall } from '@invento/shared-ui-drift-wall';

import { LangSwitcher } from '@invento/shared-ui-lang-switcher';
import { ThemeSwitcher } from '@invento/shared-ui-theme-switcher';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [TranslatePipe, RouterOutlet, DriftWall, LangSwitcher, ThemeSwitcher],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayout {}
