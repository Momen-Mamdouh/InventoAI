import { effect, inject, type Provider } from '@angular/core';
import { Directionality, type Direction } from '@angular/cdk/bidi';
import { LocaleService } from './locale-service';

/**
 * Synchronizes Angular CDK's `Directionality` token with `LocaleService.isRtl()`.
 *
 * Angular CDK's `Directionality` caches the document direction once in its constructor and does
 * not watch DOM attribute mutations. This provider keeps CDK primitives (such as Spartan's
 * dropdowns, menus, dialogs, accordions, and sheets) in sync when the user toggles languages
 * at runtime.
 */
export function provideDirectionalitySync(): Provider[] {
  return [
    {
      provide: Directionality,
      useFactory: (): Directionality => {
        const locale = inject(LocaleService);
        const directionality = new Directionality();

        effect(() => {
          const next: Direction = locale.isRtl() ? 'rtl' : 'ltr';
          if (directionality.valueSignal() === next) {
            return;
          }
          directionality.valueSignal.set(next);
          directionality.change.emit(next);
        });

        return directionality;
      },
    },
  ];
}
