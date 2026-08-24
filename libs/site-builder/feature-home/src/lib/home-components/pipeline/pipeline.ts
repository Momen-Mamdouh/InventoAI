import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmCard, HlmCardHeader, HlmCardTitle, HlmCardDescription } from '@spartan/helm/card';
import { ScrollAnimateDirective } from '@invento/shared-util-directives';
import { PageHeader } from '@invento/shared-ui-page-header';
import { hlmH3, hlmP } from '@spartan/helm/typography';
import { TranslatePipe } from '@invento/shared-util-i18n';

interface PipelineStep {
  readonly number: string;
  readonly title: string;
  readonly subtitle: string;
  readonly route: string;
}

@Component({
  selector: 'app-pipeline',
  templateUrl: './pipeline.html',
  styleUrl: './pipeline.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    HlmCard,
    HlmCardHeader,
    HlmCardTitle,
    HlmCardDescription,
    ScrollAnimateDirective,
    PageHeader,
    TranslatePipe,
  ],
})
export class Pipeline {
  protected readonly hlmH3 = hlmH3;
  protected readonly hlmP = hlmP;

  protected readonly steps = signal<PipelineStep[]>([
    {
      number: 'pipeline_num_1',
      title: 'pipeline_step_1',
      subtitle: 'pipeline_step_1_sub',
      route: '/brain',
    },
    {
      number: 'pipeline_num_2',
      title: 'pipeline_step_2',
      subtitle: 'pipeline_step_2_sub',
      route: '/ai-builder',
    },
    {
      number: 'pipeline_num_3',
      title: 'pipeline_step_3',
      subtitle: 'pipeline_step_3_sub',
      route: '/preview',
    },
    {
      number: 'pipeline_num_4',
      title: 'pipeline_step_4',
      subtitle: 'pipeline_step_4_sub',
      route: '/validation',
    },
  ]);

  onMouseMove(event: MouseEvent): void {
    const card = event.currentTarget as HTMLElement;
    const glow = card.querySelector('.pipeline-glow') as HTMLElement;
    if (!glow) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    glow.style.background = `radial-gradient(300px circle at ${x}px ${y}px, var(--color-primary) 0%, transparent 70%)`;
    glow.style.opacity = '0.08';
  }

  onMouseLeave(event: MouseEvent): void {
    const card = event.currentTarget as HTMLElement;
    const glow = card.querySelector('.pipeline-glow') as HTMLElement;
    if (!glow) return;
    glow.style.opacity = '0';
  }
}
