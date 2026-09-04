import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StepsBar } from '@invento/shared-ui-steps-bar';
import { RouterOutlet } from '@angular/router';
import { AiLoader } from '@invento/shared-ui-ai-loader';
import { BuilderState, BUILDER_STEPS } from '@invento/site-builder-data-access-builder';

@Component({
  selector: 'app-builder-layout',
  imports: [StepsBar, RouterOutlet, AiLoader],
  templateUrl: './builder-layout.html',
  styleUrl: './builder-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuilderLayout {
  protected readonly builderState = inject(BuilderState);
  protected readonly steps = BUILDER_STEPS;
}
