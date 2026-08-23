import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideX } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmDialogImports } from '@spartan/helm/dialog';
import { HlmFieldImports } from '@spartan/helm/field';
import { HlmTextareaImports } from '@spartan/helm/textarea';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmSwitchImports } from '@spartan/helm/switch';
import { HlmSpinnerImports } from '@spartan/helm/spinner';
// Brain primitives are the plain npm package — they are NOT re-exported through the
// project's `@spartan/helm` alias, so import them directly instead of reaching into
// node_modules' compiled type declarations (which is fragile and breaks on upgrades).
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import {
  CreateSupplierDto,
  Supplier,
  UpdateSupplierDto,
  SuppliersState,
} from '@invento/invento-data-access-supplier';

@Component({
  selector: 'app-supplier-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIcon,
    HlmButtonImports,
    HlmInputImports,
    HlmDialogImports,
    HlmFieldImports,
    HlmTextareaImports,
    HlmLabelImports,
    HlmSwitchImports,
    HlmSpinnerImports,
    BrnDialogImports,
  ],
  providers: [provideIcons({ lucideX, lucideCheck })],
  templateUrl: './supplier-form-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierFormDialog implements OnInit {
  @Input() supplier: Supplier | null = null;
  @Output() closed = new EventEmitter<void>();

  private readonly fb = new FormBuilder();
  private readonly state = inject(SuppliersState);

  readonly submitting = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    contactEmail: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    phone: ['', [Validators.maxLength(30)]],
    leadTimeDays: [7, [Validators.required, Validators.min(1), Validators.max(365)]],
    notes: ['', [Validators.maxLength(1000)]],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.supplier) {
      this.form.patchValue({
        name: this.supplier.name,
        contactEmail: this.supplier.contactEmail,
        phone: this.supplier.phone ?? '',
        leadTimeDays: this.supplier.leadTimeDays,
        notes: this.supplier.notes ?? '',
        isActive: this.supplier.isActive,
      });
    }
  }

  onStateChanged(state: 'open' | 'closed') {
    if (state === 'closed') this.close();
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const phone = raw.phone.trim();
    const notes = raw.notes.trim();

    const onSuccess = () => {
      this.submitting.set(false);
      this.close();
    };
    const onError = () => {
      // Keep the dialog open on failure so the user can fix and retry — the
      // toast (fired by SuppliersState) already surfaces the server message.
      this.submitting.set(false);
    };

    if (this.supplier) {
      const payload: UpdateSupplierDto = {
        name: raw.name.trim(),
        contactEmail: raw.contactEmail.trim(),
        phone: phone || null, // explicit null clears it — omitting would leave it untouched
        leadTimeDays: raw.leadTimeDays,
        notes: notes || null,
        isActive: raw.isActive,
      };
      this.state.updateSupplier(this.supplier.id, payload, onSuccess, onError);
    } else {
      const payload: CreateSupplierDto = {
        name: raw.name.trim(),
        contactEmail: raw.contactEmail.trim(),
        phone: phone || undefined,
        leadTimeDays: raw.leadTimeDays,
        notes: notes || undefined,
        isActive: raw.isActive,
      };
      this.state.createSupplier(payload, onSuccess, onError);
    }
  }
}
