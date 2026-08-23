import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { hlmUl } from '@spartan/helm/typography';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { BUILDER_STEPS } from '@/app/features/builder/constants/builder-steps';

@Component({
  selector: 'app-steps-bar',
  imports: [RouterLink, RouterLinkActive, NgClass, TranslatePipe],
  templateUrl: './steps-bar.html',
  styleUrl: './steps-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepsBar {
  protected readonly hlmUl = hlmUl;
  protected readonly steps = BUILDER_STEPS;
}
