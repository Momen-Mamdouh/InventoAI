import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { hlmUl } from '@spartan/helm/typography';
import { TranslatePipe } from '@invento/shared-util-i18n';

/** One step in a wizard's steps bar. The host app owns the actual step list and its order. */
export interface StepsBarStep {
  readonly id: string;
  readonly path: string;
  readonly labelKey: string;
}

/**
 * Presentational steps bar for a multi-step wizard. Reconciled from site-builder's fork (T168) —
 * the site-builder version's `@for`-driven, data-fed rendering replaced the earlier stub's four
 * hand-written `<li>`s, and `steps` became a required input so this stays a pure `type:ui`
 * component with no hardcoded business data (`BUILDER_STEPS` stays in site-builder's own code).
 */
@Component({
  selector: 'app-steps-bar',
  imports: [RouterLink, RouterLinkActive, NgClass, TranslatePipe],
  templateUrl: './steps-bar.html',
  styleUrl: './steps-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepsBar {
  protected readonly hlmUl = hlmUl;
  readonly steps = input.required<readonly StepsBarStep[]>();
}
