import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmP } from '@spartan/helm/typography';

@Component({
  selector: 'app-not-found',
  imports: [HlmP],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {}
