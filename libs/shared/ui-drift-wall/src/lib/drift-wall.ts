import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  computed,
  signal,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DEFAULT_ITEMS, DriftWallItem } from './drift-wall-items';

export type { DriftWallItem };
export { DEFAULT_ITEMS };

const columnFactor = (index: number, variance: number): number => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

export interface ColumnConfig {
  duration: number;
  delay: number;
  movesUp: boolean;
  copyHeight: number;
}

@Component({
  selector: 'app-drift-wall',
  standalone: true,
  templateUrl: './drift-wall.html',
  styleUrl: './drift-wall.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriftWall implements OnInit, OnDestroy {
  @Input({ transform: (v: unknown) => v ?? DEFAULT_ITEMS }) items =
    signal<DriftWallItem[]>(DEFAULT_ITEMS);
  @Input({ transform: (v: unknown) => v ?? 5 }) columns = signal<number>(5);
  @Input({ transform: (v: unknown) => v ?? 200 }) tileWidth = signal<number>(200);
  @Input({ transform: (v: unknown) => v ?? 132 }) tileHeight = signal<number>(132);
  @Input({ transform: (v: unknown) => v ?? 18 }) gap = signal<number>(18);
  @Input({ transform: (v: unknown) => v ?? 14 }) radius = signal<number>(14);
  @Input({ transform: (v: unknown) => v ?? 16 }) tilt = signal<number>(16);
  @Input({ transform: (v: unknown) => v ?? -14 }) turn = signal<number>(-14);
  @Input({ transform: (v: unknown) => v ?? 0 }) roll = signal<number>(0);
  @Input({ transform: (v: unknown) => v ?? 1200 }) perspective = signal<number>(1200);
  @Input({ transform: (v: unknown) => v ?? 120 }) depth = signal<number>(120);
  @Input({ transform: (v: unknown) => v ?? 42 }) speed = signal<number>(42);
  @Input({ transform: (v: unknown) => v ?? 'up' }) direction = signal<'up' | 'down'>('up');
  @Input({ transform: (v: unknown) => v ?? 0.45 }) variance = signal<number>(0.45);
  @Input({ transform: (v: unknown) => v ?? 0.6 }) parallax = signal<number>(0.6);
  @Input({ transform: (v: unknown) => v ?? false }) pauseOnHover = signal<boolean>(false);
  @Input({ transform: (v: unknown) => v ?? 64 }) lift = signal<number>(64);
  @Input({ transform: (v: unknown) => v ?? 0.6 }) fade = signal<number>(0.6);
  @Input({ transform: (v: unknown) => v ?? 0.55 }) dim = signal<number>(0.55);
  @Input({ transform: (v: unknown) => v ?? false }) grayscale = signal<boolean>(false);
  @Input({ transform: (v: unknown) => v ?? '#060010' }) overlayColor = signal<string>('#060010');

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLElement>;
  @ViewChild('plane', { static: true }) planeRef!: ElementRef<HTMLElement>;

  activeId = signal<string | null>(null);
  activeCol = signal<number>(-1);
  reduced = signal<boolean>(false);

  edgeValue = computed(() => `${Math.max(0, (1 - this.fade()) * 100)}%`);

  columnItems = computed(() => {
    const cols: DriftWallItem[][] = Array.from({ length: this.columns() }, () => []);
    this.items().forEach((item, i) => {
      cols[i % this.columns()].push(item);
    });
    return cols.map((col) => (col.length ? col : this.items().slice(0, 1)));
  });

  columnConfigs = computed<ColumnConfig[]>(() => {
    const unit = this.tileHeight() + this.gap();
    const isUp = this.direction() === 'up';

    return this.columnItems().map((col, c) => {
      const copyHeight = Math.max(unit, col.length * unit);
      const factor = columnFactor(c, this.variance());
      const velocity = Math.max(1, this.speed() * factor);
      const duration = Math.round((copyHeight / velocity) * 10) / 10;
      const altSign = c % 2 === 0 ? 1 : -1;
      const movesUp = (isUp && altSign === 1) || (!isUp && altSign === -1);
      const staggeredOffset = (c * 0.37) % 1;
      const delay = -Math.round(staggeredOffset * duration * 10) / 10;

      return {
        duration,
        delay,
        movesUp,
        copyHeight,
      };
    });
  });

  private io: IntersectionObserver | null = null;
  private cleanupListeners: (() => void) | null = null;
  private cleanupVisibility: (() => void) | null = null;

  private ngZone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.setupPointerListeners();
      this.setupVisibilityObserver();
    });
  }

  ngOnDestroy(): void {
    if (this.cleanupListeners) {
      this.cleanupListeners();
    }
    if (this.cleanupVisibility) {
      this.cleanupVisibility();
    }
    if (this.io) {
      this.io.disconnect();
    }
  }

  getCopiesArray(): unknown[] {
    return [0, 1];
  }

  activate(id: string, colIndex = -1): void {
    this.activeCol.set(colIndex);
    this.activeId.set(id);
  }

  release(): void {
    this.activeCol.set(-1);
    this.activeId.set(null);
  }

  private setupPointerListeners(): void {
    const container = this.containerRef?.nativeElement;
    const plane = this.planeRef?.nativeElement;
    if (!container || !plane) {
      return;
    }

    const onPointerMove = (e: PointerEvent): void => {
      if (this.reduced() || this.parallax() <= 0) {
        return;
      }
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      const px = ((e.clientX - rect.left) / rect.width - 0.5) * this.parallax() * 8;
      const py = -((e.clientY - rect.top) / rect.height - 0.5) * this.parallax() * 8;

      plane.style.setProperty('--plane-px', `${px.toFixed(2)}deg`);
      plane.style.setProperty('--plane-py', `${py.toFixed(2)}deg`);
    };

    const onPointerLeave = (): void => {
      plane.style.setProperty('--plane-px', '0deg');
      plane.style.setProperty('--plane-py', '0deg');
    };

    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerleave', onPointerLeave, { passive: true });

    this.cleanupListeners = (): void => {
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
    };
  }

  private setupVisibilityObserver(): void {
    const container = this.containerRef?.nativeElement;
    if (!container) {
      return;
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.io = new IntersectionObserver(
        ([entry]) => {
          if (entry && entry.isIntersecting) {
            container.classList.remove('drift-wall--paused');
          } else {
            container.classList.add('drift-wall--paused');
          }
        },
        { threshold: 0.05 }
      );
      this.io.observe(container);
    }

    const onVisibilityChange = (): void => {
      if (document.hidden) {
        container.classList.add('drift-wall--paused');
      } else {
        container.classList.remove('drift-wall--paused');
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    this.cleanupVisibility = (): void => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }
}
