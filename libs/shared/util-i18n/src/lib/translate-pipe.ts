import { ChangeDetectorRef, Pipe, PipeTransform, effect, inject } from '@angular/core';
import { LocaleService } from './locale-service';

@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly _localeService = inject(LocaleService);
  private readonly _cdr = inject(ChangeDetectorRef);

  constructor() {
    // This app is ZONELESS (no zone.js). An impure pipe only re-runs when its host view is
    // actually checked, and an OnPush view is only checked when something marks it dirty.
    // Reading the locale signal inside transform() is not enough to mark the host dirty, so
    // switching language used to leave already-rendered text stale until the next unrelated
    // re-render. This effect reads the signal in a tracked context and explicitly marks the
    // host view for check, which is what makes live language switching work.
    effect(() => {
      this._localeService.locale();
      this._cdr.markForCheck();
    });
  }

  transform(key: string, params?: Record<string, string | number>): string {
    this._localeService.locale();
    return this._localeService.translate(key, params);
  }
}

// Mo'men Comment: 
// TranslatePipe -> used as -> {{ 'home.title' | translate }} or {{ 'greeting' | translate: { name: user.name } }}.
//    -> translate()'s output depends on the reactive _translations signal inside LocaleService, which is not a declared pipe input, so a pure pipe wouldn't pick up changes when the locale switches.
// 
// Because pipes are impure here, Angular will call transform() every change-detection cycle regardless 
//  -> but this line adds an explicit read of the locale signal purely to make the reactive dependency obvious/intentional 
//  -> in the code, reinforcing that this pipe's output is tied to locale changes. 