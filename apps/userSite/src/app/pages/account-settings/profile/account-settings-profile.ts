import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUpload } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmTypographyImports } from '@spartan/helm/typography';

@Component({
  selector: 'app-account-settings-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIcon,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmCardImports,
    HlmTypographyImports,
  ],
  providers: [provideIcons({ lucideUpload })],
  templateUrl: './account-settings-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsProfileComponent {
  private readonly fb = inject(FormBuilder);

  // Business/Company Name, Time Zone and Language fields removed per request.
  readonly form = this.fb.nonNullable.group({
    firstName: ['Clara', Validators.required],
    lastName: ['Morin', Validators.required],
    email: ['clara@luminarygoods.com', [Validators.required, Validators.email]],
    phone: ['+1 503 441 9900'],
  });

  private readonly firstName = signal(this.form.controls.firstName.value);
  private readonly lastName = signal(this.form.controls.lastName.value);

  constructor() {
    this.form.controls.firstName.valueChanges.subscribe((v) => this.firstName.set(v));
    this.form.controls.lastName.valueChanges.subscribe((v) => this.lastName.set(v));
  }

  readonly initials = computed(() => {
    const f = this.firstName()?.[0] ?? '';
    const l = this.lastName()?.[0] ?? '';
    return `${f}${l}`.toUpperCase();
  });

  save() {
    if (this.form.invalid) return;
    console.log('Saving profile', this.form.getRawValue());
  }

  cancel() {
    this.form.reset({
      firstName: 'Clara',
      lastName: 'Morin',
      email: 'clara@luminarygoods.com',
      phone: '+1 503 441 9900',
    });
  }
}
