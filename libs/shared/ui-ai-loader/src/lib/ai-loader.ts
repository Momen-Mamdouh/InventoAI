import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-ai-loader',
  templateUrl: './ai-loader.html',
  styleUrl: './ai-loader.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiLoader {}
