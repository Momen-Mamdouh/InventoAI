import {
  Directive,
  ElementRef,
  PLATFORM_ID,
  inject,
  output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appContainerWidth]',
  standalone: true,
})
export class ContainerWidth implements OnInit, OnDestroy {
  readonly width = output<number>();
  private observer?: ResizeObserver;
  private el = inject(ElementRef<HTMLElement>);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    // ResizeObserver does not exist on the server. Without this guard every
    // prerendered route carrying this directive threw
    // "ReferenceError: ResizeObserver is not defined" during the build.
    if (!this.isBrowser) return;

    this.observer = new ResizeObserver(([entry]) => {
      this.width.emit(Math.floor(entry.contentRect.width));
    });
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
