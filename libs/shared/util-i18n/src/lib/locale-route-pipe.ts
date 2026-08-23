import { ChangeDetectorRef, Pipe, PipeTransform, effect, inject } from '@angular/core';
import { LocaleService } from './locale-service';

@Pipe({
  name: 'localeRoute',
  pure: false,
})
export class LocaleRoutePipe implements PipeTransform {
  private readonly _localeService = inject(LocaleService);
  private readonly _cdr = inject(ChangeDetectorRef);

  constructor() {
    // Same zoneless/OnPush reason as TranslatePipe: mark the host view dirty when the locale
    // changes, otherwise already-rendered routerLinks keep the previous locale prefix.
    effect(() => {
      this._localeService.locale();
      this._cdr.markForCheck();
    });
  }

  transform(segments: string[]): string[] {
    this._localeService.locale();
    return this._localeService.localePath(segments);
  }
}

// Mo'men Comment: 
// LocaleRoutePipe -> do: [routerLink]="['products', '42'] | localeRoute"
//    -> instead of calling -> localeService.localePath(...) from the component class, a nice ergonomic convenience for template-only usage.
// 
// pure: false -> means -> an impure pipe
//    -> By default, Angular pipes are pure: Angular only re-runs transform() when the input reference changes (segments)
//      -> Since _localeService.locale() is not one of the pipe's declared inputs, a pure pipe would never re-run when the locale changes 
//      -> it would silently keep showing the old locale in the URL. Marking it pure: false forces Angular to re-run transform() on every change detection cycle, 
//      -> regardless of whether inputs changed, which correctly picks up the new locale value each time. 
// 
// .