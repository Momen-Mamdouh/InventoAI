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
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmSheetImports } from '@spartan/helm/sheet';
import { HlmFieldImports } from '@spartan/helm/field';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmSwitchImports } from '@spartan/helm/switch';
import { HlmTextareaImports } from '@spartan/helm/textarea';
import { ApiErrorBody, FaqEntry, FaqStore } from '@invento/invento-data-access-faq';

/**
 * Presentational add/edit form. It owns the save call itself (via FaqStore)
 * but doesn't know about sheets - the parent decides what "saved"/"cancel"
 * means (e.g. closing an hlm-sheet's portal ctx). Meant to be projected
 * straight into an <hlm-sheet-content>.
 */
@Component({
  selector: 'app-faq-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmSheetImports,
    HlmFieldImports,
    HlmInputImports,
    HlmLabelImports,
    HlmSwitchImports,
    HlmTextareaImports,
  ],
  templateUrl: './faq-form.component.html',
})
export class FaqFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(FaqStore);

  /** Pass an entry to edit it; omit (or null) to create a new one. */
  readonly entry = input<FaqEntry | null>(null);
  readonly saved = output<FaqEntry>();
  readonly canceled = output<void>();

  protected readonly isEdit = computed(() => !!this.entry());
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    question: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
    answer: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(2000)]],
    isPublished: [true],
  });

  ngOnInit(): void {
    const current = this.entry();
    if (current) {
      this.form.patchValue({
        question: current.question,
        answer: current.answer,
        isPublished: current.isPublished,
      });
    }
  }

  protected async onSubmit(): Promise<void> {
    // Reentrancy guard: without this, a double-click (or an Enter keypress
    // racing a mouse click) can fire onSubmit twice, which emits `saved`
    // twice and makes the parent's dialog appear to close/reopen/close.
    if (this.saving()) return;

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
    } catch (e) {
      this.serverError.set(this.extractError(e));
    } finally {
      this.saving.set(false);
    }
  }

  protected onCancel(): void {
    if (this.saving()) return; // don't abandon an in-flight save
    this.canceled.emit();
  }

  private extractError(e: unknown): string {
    const httpError = e as { error?: ApiErrorBody };
    const msg = httpError?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg ?? 'Something went wrong. Please try again.';
  }
}
