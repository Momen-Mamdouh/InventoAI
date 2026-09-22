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
import { lucideAlertCircle, lucideSave, lucidePlus } from '@ng-icons/lucide';
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
import {
  CreateSupplierDto,
  Supplier,
  SuppliersState,
  UpdateSupplierDto,
} from '@invento/owner-dashboard-data-access-supplier';

@Component({
  selector: 'app-supplier-form',
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
  providers: [provideIcons({ lucideAlertCircle, lucideSave, lucidePlus })],
  templateUrl: './supplier-form.html',
})
export class SupplierForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly state = inject(SuppliersState);

  /** Pass a supplier to edit; omit or pass null to create a new one. */
  readonly supplier = input<Supplier | null>(null);
  readonly saved = output<Supplier>();
  readonly canceled = output<void>();

  protected readonly isEdit = computed(() => !!this.supplier());
  protected readonly submitting = signal<boolean>(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    contactEmail: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    phone: ['', [Validators.maxLength(30)]],
    leadTimeDays: [7, [Validators.required, Validators.min(1), Validators.max(365)]],
    notes: ['', [Validators.maxLength(1000)]],
    isActive: [true],
  });

  ngOnInit(): void {
    const current = this.supplier();
    if (current) {
      this.form.patchValue({
        name: current.name,
        contactEmail: current.contactEmail,
        phone: current.phone ?? '',
        leadTimeDays: current.leadTimeDays,
        notes: current.notes ?? '',
        isActive: current.isActive,
      });
    }
  }

  protected onSubmit(): void {
    if (this.submitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);

    const raw = this.form.getRawValue();
    const phone = raw.phone.trim();
    const notes = raw.notes.trim();
    const current = this.supplier();

    const onSuccess = (res: Supplier) => {
      this.submitting.set(false);
      this.saved.emit(res);
    };

    const onError = (msg: string) => {
      this.submitting.set(false);
      this.serverError.set(msg);
    };

    if (current) {
      const payload: UpdateSupplierDto = {
        name: raw.name.trim(),
        contactEmail: raw.contactEmail.trim(),
        phone: phone || null,
        leadTimeDays: raw.leadTimeDays,
        notes: notes || null,
        isActive: raw.isActive,
      };
      this.state.updateSupplier(current.id, payload, onSuccess, onError);
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

  protected onCancel(): void {
    if (this.submitting()) {
      return;
    }
    this.canceled.emit();
  }
}
