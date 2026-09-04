import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSlash } from '@ng-icons/lucide';

@Component({
  selector: 'app-double-slash',
  imports: [NgIcon],
  providers: [provideIcons({ lucideSlash })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './double-slash.html',
  styleUrl: './double-slash.css',
})
export class DoubleSlash {}
