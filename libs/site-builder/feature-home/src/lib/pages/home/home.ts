import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Hero } from '../../home-components/hero/hero';
import { Stats } from '../../home-components/stats/stats';
import { Pipeline } from '../../home-components/pipeline/pipeline';
import { Capabilities } from '../../home-components/capabilities/capabilities';
import { Cta } from '../../home-components/cta/cta';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Hero, Stats, Pipeline, Capabilities, Cta],
})
export class Home {}
