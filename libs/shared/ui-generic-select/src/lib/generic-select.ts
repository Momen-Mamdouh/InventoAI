import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { HlmSelectImports } from '@spartan/helm/select';

export interface GenericSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  suffix?: string;
}

@Component({
  selector: 'app-generic-select',
  templateUrl: './generic-select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmSelectImports]
})
export class GenericSelect {
  public readonly options = input<GenericSelectOption[]>([]);
  public readonly value = input<string | null>('');
  public readonly placeholder = input<string>('Select an option');
  public readonly triggerWidth = input<string>('w-full');

  public readonly valueChange = output<string>();

  public readonly selectedLabel = computed(() => {
    const val = this.value();
    const opt = this.options().find(o => o.value === val);
    if (!opt) return null;
    return opt.label + (opt.suffix ? ` (${opt.suffix})` : '');
  });

  protected onValueChange(val: string | unknown): void {
    if (typeof val === 'string') {
      this.valueChange.emit(val);
    }
  }
}

export const GenericSelectImports = [GenericSelect] as const;
