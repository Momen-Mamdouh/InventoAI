import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HlmP } from '@spartan/helm/typography';

@Component({
  selector: 'app-users',
  imports: [HlmP],
  templateUrl: './users.html',
  styleUrl: './users.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users {}
