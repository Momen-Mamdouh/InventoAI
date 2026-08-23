import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmCard, HlmCardHeader, HlmCardTitle, HlmCardDescription } from '@spartan/helm/card';
import { ScrollAnimateDirective } from '@invento/shared-util-directives';
import { PageHeader } from '@invento/shared-ui-page-header';
import { hlmH3, hlmP } from '@spartan/helm/typography';

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
  ],
})
export class Pipeline {
  protected readonly hlmH3 = hlmH3;
  protected readonly hlmP = hlmP;

  protected readonly steps = signal<PipelineStep[]>([
    { number: '01', title: 'Brainstorm', subtitle: 'Raw business concept', route: '/brain' },
    { number: '02', title: 'AI Interview', subtitle: 'Schema extraction', route: '/ai-builder' },
    { number: '03', title: 'Preview', subtitle: 'Preview AI generated theme', route: '/preview' },
    { number: '04', title: 'Validation', subtitle: 'Site Name vailability', route: '/validation' },
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
