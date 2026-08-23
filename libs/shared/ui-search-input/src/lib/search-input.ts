import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmButton } from '@spartan/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideX } from '@ng-icons/lucide';

/**
 * Shared search field.
 *
 * Supports two consumer styles so signal-driven and reactive-forms features can share it:
 *  - reactive forms: pass `[control]` (a FormControl), as products-toolbar does;
 *  - signals: two-way bind `[(value)]`, as faq and orders do via their stores.
 *
 * Icon positions use logical properties (start/end) so the field mirrors correctly in RTL.
 */
@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [ReactiveFormsModule, HlmInputImports, HlmButton, NgIcon],
  providers: [provideIcons({ lucideSearch, lucideX })],
  templateUrl: './search-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInput {
  /** Reactive-forms mode. Mutually exclusive with `value`. */
  public readonly control = input<FormControl<string | null> | undefined>(undefined);
  /** Signal mode: two-way bindable current query. */
  public readonly value = model<string>('');

  public readonly placeholder = input<string>('Search...');
  public readonly isInvalid = input<boolean>(false);
  public readonly ariaLabel = input<string>('Search');

  public readonly enterPressed = output<void>();
  public readonly clearPressed = output<void>();

  /** True when a clear button should be shown, for whichever mode is in use. */
  protected readonly hasValue = computed(() => {
    const ctrl = this.control();
    return ctrl ? !!ctrl.value : !!this.value();
  });

  protected onInput(event: Event): void {
    if (this.control()) return; // reactive forms drives itself
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.control()?.setValue('');
    this.value.set('');
    this.clearPressed.emit();
  }
}
