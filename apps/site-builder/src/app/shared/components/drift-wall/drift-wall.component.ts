import {
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
  effect,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface DriftWallItem {
  image: string;
  title?: string;
  href?: string;
}

export const DEFAULT_ITEMS: DriftWallItem[] = [
  {
    image:
      'https://cdn.dribbble.com/userupload/34101316/file/original-dc4c2119c50d2c5681863f33c0aa470c.png?resize=1600x1200',
    title: 'Analytics Platform',
  },
  {
    image: 'https://mir-s3-cdn-cf.behance.net/project_modules/fs/c61bb7180906513.6512d71dda59a.png',
    title: 'CRM Platform',
  },
  {
    image:
      'https://cdn.dribbble.com/userupload/44482331/file/dd73acebc3bcba55b8001009fd9b7f5b.png?resize=1600x1200',
    title: 'AI SaaS',
  },
  {
    image: 'https://cdn.dribbble.com/users/2436848/screenshots/17228956/givmoney_-_light_4x.png',
    title: 'Fintech Website',
  },
  {
    image:
      'https://cdn.dribbble.com/userupload/10255298/file/original-59151f99094607b6ed3d9b13dad2d6ed.jpg?resize=752x&vertical=center',
    title: 'Restaurant Website',
  },
  {
    image:
      'https://cdn.dribbble.com/userupload/8205039/file/original-b43aeb435c73e870ac823a6d135d11f1.png?crop=0x0-4000x3000&resize=1600x1200',
    title: 'Restaurant Landing',
  },
  {
    image:
      'https://thefrontkit.com/products/templates/crm-dashboard-kit/images/theme-toggle/light.png',
    title: 'Business CRM',
  },
  {
    image:
      'https://mir-s3-cdn-cf.behance.net/project_modules/1400/e081df192830615.65e1b8ed8f5a0.jpg',
    title: 'E-commerce Store',
  },
  {
    image: 'https://lumi.uicore.co/wp-content/uploads/2023/02/service-inner.webp',
    title: 'SaaS Website',
  },
  {
    image:
      'https://www.daidu.ai/cdn/shop/files/NewProject-2025-10-21T152532.584_1080x1080.jpg?v=1761051681',
    title: 'AI Platform',
  },
  {
    image:
      'https://cdn.dribbble.com/userupload/45763781/file/de6c65d9fccd62207d92cde852488d8b.png?resize=1600x1200',
    title: 'Finance Platform',
  },
  {
    image:
      'https://y4pdgnepgswqffpt.public.blob.vercel-storage.com/templates/54837/nglumen-Zk2Vc6XW39dgI9iZ8kVedtfqT02Aoa',
    title: 'Fintech Product',
  },
  {
    image:
      'https://cdn.dribbble.com/userupload/44482331/file/dd73acebc3bcba55b8001009fd9b7f5b.png?resize=1600x1200',
    title: 'AI Product',
  },
  {
    image: 'https://cdn.dribbble.com/users/2436848/screenshots/17228956/givmoney_-_light_4x.png',
    title: 'Payment Platform',
  },
  {
    image:
      'https://cdn.dribbble.com/userupload/10255298/file/original-59151f99094607b6ed3d9b13dad2d6ed.jpg?resize=752x&vertical=center',
    title: 'Food & Dining',
  },
  {
    image:
      'https://mir-s3-cdn-cf.behance.net/project_modules/1400/e9c17d176142949.64bfe32259ec9.png',
    title: 'Financial Analytics',
  },
  {
    image:
      'https://cdn.dribbble.com/userupload/34101316/file/original-dc4c2119c50d2c5681863f33c0aa470c.png?resize=1600x1200',
    title: 'Business Intelligence',
  },
  {
    image:
      'https://mir-s3-cdn-cf.behance.net/project_modules/1400/e081df192830615.65e1b8ed8f5a0.jpg',
    title: 'Shopping Platform',
  },
  {
    image:
      'https://cdn.dribbble.com/userupload/8205039/file/original-b43aeb435c73e870ac823a6d135d11f1.png?crop=0x0-4000x3000&resize=1600x1200',
    title: 'Food Delivery',
  },
  {
    image: 'https://lumi.uicore.co/wp-content/uploads/2023/02/service-inner.webp',
    title: 'Product Website',
  },
  {
    image:
      'https://y4pdgnepgswqffpt.public.blob.vercel-storage.com/templates/54837/nglumen-Zk2Vc6XW39dgI9iZ8kVedtfqT02Aoa',
    title: 'Digital Banking',
  },
  {
    image:
      'https://cdn.dribbble.com/userupload/44482331/file/dd73acebc3bcba55b8001009fd9b7f5b.png?resize=1600x1200',
    title: 'Automation Platform',
  },
  {
    image: 'https://cdn.dribbble.com/users/2436848/screenshots/17228956/givmoney_-_light_4x.png',
    title: 'Finance App',
  },
  {
    image:
      'https://thefrontkit.com/products/templates/crm-dashboard-kit/images/theme-toggle/light.png',
    title: 'Sales Management',
  },
];

const columnFactor = (index: number, variance: number) => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

@Component({
  selector: 'app-drift-wall',
  standalone: true,
  templateUrl: './drift-wall.component.html',
  styleUrls: ['./drift-wall.component.css'],
})
export class DriftWallComponent implements OnInit, OnDestroy {
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

  containerHeight = signal<number>(600);
  activeId = signal<string | null>(null);
  reduced = signal<boolean>(false);

  edgeValue = computed(() => `${Math.max(0, (1 - this.fade()) * 100)}%`);

  columnItems = computed(() => {
    const cols: DriftWallItem[][] = Array.from({ length: this.columns() }, () => []);
    this.items().forEach((item, i) => cols[i % this.columns()].push(item));
    return cols.map((col) => (col.length ? col : this.items().slice(0, 1)));
  });

  columnMeta = computed(() => {
    const unit = this.tileHeight() + this.gap();
    return this.columnItems().map((col) => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.max(2, Math.ceil((this.containerHeight() * 1.6) / copyHeight) + 1);
      return { copyHeight, copies };
    });
  });

  baseVelocities = computed(() => {
    const dirSign = this.direction() === 'up' ? 1 : -1;
    return this.columnItems().map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return this.speed() * columnFactor(c, this.variance()) * dirSign * altSign;
    });
  });

  private ro: ResizeObserver | null = null;
  private rafRef: number | null = null;
  private offsets: number[] = [];
  private velocities: number[] = [];
  private hoveredCol = -1;
  private wallHovered = false;
  private pointer = { x: 0, y: 0 };
  private pointerDamped = { x: 0, y: 0 };
  private lastTs: number | null = null;
  private mqListener: ((e: MediaQueryListEvent) => void) | null = null;

  private ngZone = inject(NgZone);
  private el = inject(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    effect(() => {
      // Re-initialize offsets and velocities when meta or items change
      this.offsets = this.columnMeta().map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));
      this.velocities = this.columnItems().map(() => 0);
    });
  }

  ngOnInit() {
    this.reduced.set(false);

    // ResizeObserver and requestAnimationFrame are browser-only. The auth
    // layout renders this wall, so without the guard every prerendered auth
    // route threw "ReferenceError: ResizeObserver is not defined".
    if (!this.isBrowser) return;

    this.ro = new ResizeObserver(([entry]) => {
      this.containerHeight.set(entry.contentRect.height || 600);
    });
    this.ro.observe(this.containerRef.nativeElement);

    // Start animation loop outside angular
    this.ngZone.runOutsideAngular(() => {
      this.rafRef = requestAnimationFrame((ts) => this.animate(ts));
    });
  }

  ngOnDestroy() {
    if (this.ro) this.ro.disconnect();
    if (this.rafRef) cancelAnimationFrame(this.rafRef);
  }

  getCopiesArray(colIndex: number): unknown[] {
    const meta = this.columnMeta()[colIndex];
    return Array.from({ length: meta ? meta.copies : 0 });
  }

  activate(id: string, index: number) {
    this.hoveredCol = index;
    this.activeId.set(id);
  }

  release() {
    this.hoveredCol = -1;
    this.activeId.set(null);
  }

  handlePointerMove(e: PointerEvent) {
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    if (this.parallax() > 0 && !this.reduced()) {
      this.pointer = {
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      };
    }

    // Instead of document.elementFromPoint in Angular, we just let mouseenter/leave on elements handle hover state,
    // but the React code uses elementFromPoint for parallax hover detection because 3D transforms mess up normal hit testing.
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const tile = hit && hit.closest ? (hit.closest('[data-tile-id]') as HTMLElement) : null;
    if (!tile) return;
    const id = tile.dataset['tileId'];
    if (id === this.activeId()) return;

    this.hoveredCol = Number(tile.dataset['col']);
    this.activeId.set(id!);
  }

  handlePointerEnter() {
    this.wallHovered = true;
  }

  handlePointerLeave() {
    this.wallHovered = false;
    this.pointer = { x: 0, y: 0 };
    this.release();
  }

  private applyPlaneTransform(px: number, py: number) {
    const plane = this.planeRef.nativeElement;
    plane.style.transform =
      `translate(-50%, -50%) scale(1.18) ` +
      `rotateX(${this.tilt() + py}deg) rotateY(${this.turn() + px}deg) rotateZ(${this.roll()}deg) ` +
      `translateZ(${-this.depth()}px)`;
  }

  private animate(ts: number) {
    if (this.lastTs === null) this.lastTs = ts;
    const dt = Math.min(0.05, Math.max(0, ts - this.lastTs) / 1000);
    this.lastTs = ts;

    const maxTilt = this.parallax() * 8;
    const targetX = this.pointer.x * maxTilt;
    const targetY = -this.pointer.y * maxTilt;
    const damp = 1 - Math.exp(-dt / 0.12);
    this.pointerDamped.x += (targetX - this.pointerDamped.x) * damp;
    this.pointerDamped.y += (targetY - this.pointerDamped.y) * damp;

    this.applyPlaneTransform(this.pointerDamped.x, this.pointerDamped.y);

    const trackElements = this.containerRef.nativeElement.querySelectorAll('.drift-wall__track');

    if (!this.reduced()) {
      for (let c = 0; c < trackElements.length; c++) {
        const meta = this.columnMeta()[c];
        if (!meta) continue;
        const paused = this.wallHovered && this.pauseOnHover();
        const factor = paused || this.hoveredCol === c ? 0 : 1;
        const target = this.baseVelocities()[c] * factor;

        const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
        this.velocities[c] += (target - this.velocities[c]) * ease;
        let next = (this.offsets[c] ?? 0) + this.velocities[c] * dt;
        next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
        this.offsets[c] = next;

        const el = trackElements[c] as HTMLElement;
        if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
      }
    } else {
      for (let c = 0; c < trackElements.length; c++) {
        const el = trackElements[c] as HTMLElement;
        if (el) el.style.transform = `translate3d(0, ${-(this.offsets[c] ?? 0)}px, 0)`;
      }
    }

    this.rafRef = requestAnimationFrame((newTs) => this.animate(newTs));
  }
}
