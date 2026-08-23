import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { hlmUl } from '@spartan/helm/typography';

@Component({
  selector: 'app-steps-bar',
  imports: [RouterLink, RouterLinkActive, NgClass],
  templateUrl: './steps-bar.html',
  styleUrl: './steps-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepsBar {
  protected readonly hlmUl = hlmUl;
}
