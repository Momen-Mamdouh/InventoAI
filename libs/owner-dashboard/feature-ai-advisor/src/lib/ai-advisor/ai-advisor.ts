import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AiAdvisorPanel } from '../ai-advisor-panel/ai-advisor-panel';

@Component({
  selector: 'app-ai-advisor',
  imports: [AiAdvisorPanel],
  templateUrl: './ai-advisor.html',
  styleUrl: './ai-advisor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAdvisor {}
