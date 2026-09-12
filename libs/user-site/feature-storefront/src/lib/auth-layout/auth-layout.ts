import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LangSwitcher } from '@invento/shared-ui-lang-switcher';
import { ThemeSwitcher } from '@invento/shared-ui-theme-switcher';

@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, LangSwitcher, ThemeSwitcher],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayout {}
