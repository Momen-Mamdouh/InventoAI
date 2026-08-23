import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmCard, HlmCardHeader, HlmCardTitle, HlmCardContent } from '@spartan/helm/card';
import { HlmBadge } from '@spartan/helm/badge';
import { lucideTrendingUp, lucideTrendingDown, lucideMinus } from '@ng-icons/lucide';
import { TranslatePipe } from '@invento/shared-util-i18n';

@Component({
  selector: 'app-kpi-card',
  imports: [NgIcon, HlmCard, HlmCardHeader, HlmCardTitle, HlmCardContent, HlmBadge, TranslatePipe],
  providers: [provideIcons({ lucideTrendingUp, lucideTrendingDown, lucideMinus })],
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCard {
  readonly title = input.required<string>();
  readonly value = input.required<string>();
  readonly trend = input<'up' | 'down' | 'neutral'>('neutral');
  readonly icon = input<string>();
}
