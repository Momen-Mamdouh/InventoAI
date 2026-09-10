import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StepsBar, StepsBarStep } from '@invento/shared-ui-steps-bar';
import { Router, RouterOutlet } from '@angular/router';
import { AiLoader } from '@invento/shared-ui-ai-loader';
import {
  BuilderState,
  BUILDER_STEPS,
  BuilderStepId,
} from '@invento/site-builder-data-access-builder';
import { LocaleService } from '@invento/shared-util-i18n';
import { toast } from '@spartan/helm/sonner';

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
  private readonly router = inject(Router);
  private readonly localeService = inject(LocaleService);

  protected onStepClick({ step, event }: { step: StepsBarStep; event: MouseEvent }): void {
    const currentUrl = this.router.url;
    const currentStepConfig = BUILDER_STEPS.find((s) => currentUrl.startsWith(s.path));
    const currentStepId = currentStepConfig?.id ?? 'brainstorm';
    const currentStepIndex = BUILDER_STEPS.findIndex((s) => s.id === currentStepId);
    const targetStepIndex = BUILDER_STEPS.findIndex((s) => s.id === step.id);

    // If user attempts to jump ahead to a subsequent step:
    if (targetStepIndex > currentStepIndex) {
      const firstIncomplete = BUILDER_STEPS.slice(0, targetStepIndex).find(
        (s) => !this.builderState.isStepComplete(s.id),
      );

      if (firstIncomplete) {
        event.preventDefault();
        event.stopPropagation();
        this.notifyStepBlocked(firstIncomplete.id);
        this.builderState.triggerStepEnforcement(firstIncomplete.id);
      }
    }
  }

  private notifyStepBlocked(stepId: BuilderStepId): void {
    switch (stepId) {
      case 'brainstorm': {
        if (!this.builderState.hasLogo()) {
          toast.warning(this.localeService.translate('toast_step_brainstorm_missing_logo'));
        } else if (!this.builderState.hasBrainstormInput()) {
          toast.warning(this.localeService.translate('toast_step_brainstorm_missing_desc'));
        } else {
          toast.warning(this.localeService.translate('toast_step_brainstorm_not_analyzed'));
        }
        break;
      }
      case 'ai-interview': {
        if (!this.builderState.hasAiInterviewAnswers()) {
          toast.warning(this.localeService.translate('toast_step_interview_incomplete'));
        } else {
          toast.warning(this.localeService.translate('toast_step_interview_submit_required'));
        }
        break;
      }
      case 'validation': {
        if (!this.builderState.hasValidationInputs()) {
          toast.warning(this.localeService.translate('toast_step_validation_incomplete'));
        } else {
          toast.warning(this.localeService.translate('toast_step_validation_check_domain'));
        }
        break;
      }
      default:
        break;
    }
  }
}
