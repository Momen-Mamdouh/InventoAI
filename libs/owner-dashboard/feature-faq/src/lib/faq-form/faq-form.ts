import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlertCircle,
  lucideSave,
  lucidePlus,
  lucideHelpCircle,
  lucidePackage,
  lucideTruck,
  lucideCreditCard,
  lucideShield,
  lucideHeadphones,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { HlmInput } from '@spartan/helm/input';
import { HlmLabel } from '@spartan/helm/label';
import { HlmSwitch } from '@spartan/helm/switch';
import { HlmTextarea } from '@spartan/helm/textarea';
import { HlmSpinner } from '@spartan/helm/spinner';
import {
  HlmSheetHeader,
  HlmSheetTitle,
  HlmSheetDescription,
  HlmSheetFooter,
} from '@spartan/helm/sheet';
import { HlmAlert, HlmAlertDescription } from '@spartan/helm/alert';
import { TranslatePipe } from '@invento/shared-util-i18n';
import { extractErrorMessage } from '@invento/shared-util-error';
import { FaqEntry, FaqStore } from '@invento/owner-dashboard-data-access-faq';

@Component({
  selector: 'app-faq-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NgIcon,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmSwitch,
    HlmTextarea,
    HlmSpinner,
    HlmSheetHeader,
    HlmSheetTitle,
    HlmSheetDescription,
    HlmSheetFooter,
    HlmAlert,
    HlmAlertDescription,
    TranslatePipe,
  ],
  providers: [
    provideIcons({
      lucideAlertCircle,
      lucideSave,
      lucidePlus,
      lucideHelpCircle,
      lucidePackage,
      lucideTruck,
      lucideCreditCard,
      lucideShield,
      lucideHeadphones,
    }),
  ],
  templateUrl: './faq-form.html',
})
export class FaqForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(FaqStore);

  /** Pass an entry to edit it; omit (or null) to create a new one. */
  readonly entry = input<FaqEntry | null>(null);
  readonly saved = output<FaqEntry>();
  readonly canceled = output<void>();

  protected readonly presets = [
    { id: 'general', icon: 'lucideHelpCircle' },
    { id: 'orders', icon: 'lucidePackage' },
    { id: 'shipping', icon: 'lucideTruck' },
    { id: 'payments', icon: 'lucideCreditCard' },
    { id: 'returns', icon: 'lucideShield' },
    { id: 'support', icon: 'lucideHeadphones' },
  ] as const;

  protected readonly isEdit = computed(() => !!this.entry());
  protected readonly saving = signal<boolean>(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    question: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
    answer: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(2000)]],
    category: ['general', [Validators.required, Validators.maxLength(50)]],
    isPublished: [true],
  });

  protected readonly selectedPreset = computed(() => {
    const val = this.form.controls.category.value.trim().toLowerCase();
    const found = this.presets.find((p) => p.id === val);
    return found ? found.id : 'custom';
  });

  ngOnInit(): void {
    const current = this.entry();
    if (current) {
      this.form.patchValue({
        question: current.question,
        answer: current.answer,
        category: current.category || 'general',
        isPublished: current.isPublished,
      });
    }
  }

  protected selectPreset(id: string): void {
    this.form.controls.category.setValue(id);
    this.form.controls.category.markAsDirty();
  }

  protected async onSubmit(): Promise<void> {
    if (this.saving()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.serverError.set(null);
    const value = this.form.getRawValue();
    const current = this.entry();

    try {
      const result = current
        ? await this.store.update(current.id, value)
        : await this.store.create(value);
      this.saved.emit(result);
    } catch (e: unknown) {
      this.serverError.set(extractErrorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }

  protected onCancel(): void {
    if (this.saving()) {
      return;
    }
    this.canceled.emit();
  }
}
