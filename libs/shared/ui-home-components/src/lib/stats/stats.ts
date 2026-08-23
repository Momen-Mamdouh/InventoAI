import {
  ChangeDetectionStrategy,
  Component,
  signal,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
  ElementRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrollAnimateDirective } from '@invento/shared-util-directives';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideInfinity, lucidePercent } from '@ng-icons/lucide';

interface Stat {
  readonly label: string;
  readonly numericValue: number | null;
  readonly prefixIcon?: string;
  readonly suffixIcon?: string;
  readonly suffixText?: string;
  readonly standaloneIcon?: string;
}

interface DisplayStat {
  readonly label: string;
  value: string;
  readonly prefixIcon?: string;
  readonly suffixIcon?: string;
  readonly suffixText?: string;
  readonly standaloneIcon?: string;
}

@Component({
  selector: 'app-stats',
  templateUrl: './stats.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollAnimateDirective, NgIcon],
  providers: [provideIcons({ lucideInfinity, lucidePercent, lucideChevronLeft })],
})
export class Stats implements OnInit, OnDestroy {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _el = inject(ElementRef);
  private _observer: IntersectionObserver | null = null;
  private _animationStarted = false;

  private readonly _stats: Stat[] = [
    {
      label: 'Build Stages',
      numericValue: 4,
    },
    {
      label: 'Schema Types',
      numericValue: null,
      standaloneIcon: 'lucideInfinity',
    },
    {
      label: 'AI-Generated',
      numericValue: 100,
      suffixIcon: 'lucidePercent',
    },
    {
      label: 'Time to Deploy',
      numericValue: 2,
      prefixIcon: 'lucideChevronLeft',
      suffixText: 'min',
    },
  ];

  protected readonly displayStats = signal<DisplayStat[]>(
    this._stats.map((s) => ({
      label: s.label,
      value: s.numericValue !== null ? '0' : '',
      prefixIcon: s.prefixIcon,
      suffixIcon: s.suffixIcon,
      suffixText: s.suffixText,
      standaloneIcon: s.standaloneIcon,
    })),
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this._platformId)) {
      this.displayStats.set(
        this._stats.map((s) => ({
          label: s.label,
          value: s.numericValue !== null ? String(s.numericValue) : '',
          prefixIcon: s.prefixIcon,
          suffixIcon: s.suffixIcon,
          suffixText: s.suffixText,
          standaloneIcon: s.standaloneIcon,
        })),
      );
      return;
    }

    this._observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this._animationStarted) {
          this._animationStarted = true;
          this._runCounters();
          this._observer?.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    this._observer.observe(this._el.nativeElement);
  }

  ngOnDestroy(): void {
    this._observer?.disconnect();
  }

  private _runCounters(): void {
    this._stats.forEach((stat, index) => {
      if (stat.numericValue === null) return;

      const duration = 1800;
      const steps = 60;
      const stepTime = duration / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += stat.numericValue! / steps;
        if (current >= stat.numericValue!) {
          current = stat.numericValue!;
          clearInterval(timer);
        }

        this.displayStats.update((stats) =>
          stats.map((s, i) => (i === index ? { ...s, value: `${Math.round(current)}` } : s)),
        );
      }, stepTime);
    });
  }
}
