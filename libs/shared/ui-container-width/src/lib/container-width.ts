import { Directive, ElementRef, inject, output, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appContainerWidth]',
  standalone: true,
})
export class ContainerWidth implements OnInit, OnDestroy {
  readonly width = output<number>();
  private observer?: ResizeObserver;
  private el = inject(ElementRef<HTMLElement>);

  ngOnInit(): void {
    this.observer = new ResizeObserver(([entry]) => {
      this.width.emit(Math.floor(entry.contentRect.width));
    });
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
