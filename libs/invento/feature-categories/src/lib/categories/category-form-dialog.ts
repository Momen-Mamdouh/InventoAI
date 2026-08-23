import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX, lucideCheck } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmDialogImports } from '@spartan/helm/dialog';
import { HlmFieldImports } from '@spartan/helm/field';
import { HlmTextareaImports } from '@spartan/helm/textarea';
import { Category, CategoriesState } from '@invento/invento-data-access-category';
import { HlmLabelImports } from '@spartan/helm/label';
import { HlmSwitchImports } from '@spartan/helm/switch';
import { HlmSpinnerImports } from '@spartan/helm/spinner';
// Brain primitives are the plain npm package — they are NOT re-exported through the
// project's `@spartan/helm` alias, so import them directly instead of reaching into
// node_modules' compiled type declarations (which is fragile and breaks on upgrades).
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { ImageUpload } from './image-upload';

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Component({
  selector: 'app-category-form-dialog',
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
    ImageUpload,
  ],
  providers: [provideIcons({ lucideX, lucideCheck })],
  templateUrl: './category-form-dialog.html',
  styleUrls: ['./category-form-dialog.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormDialog implements OnInit {
  @Input() category: Category | null = null;
  @Output() closed = new EventEmitter<void>();

  private readonly fb = new FormBuilder();
  private readonly state = inject(CategoriesState);

  readonly submitting = signal(false);
  readonly imageUrl = signal<string | null>(null);
  readonly imageBusy = signal(false);

  /** Tracks whether the user has manually edited the slug, so we stop auto-generating it. */
  private slugTouchedByUser = false;

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: [''],
    description: [''],
    isPublished: [false],
    isFeatured: [false],
  });

  ngOnInit(): void {
    if (this.category) {
      this.slugTouchedByUser = true; // never auto-overwrite an existing category's slug
      this.imageUrl.set(this.category.imageUrl);
      this.form.patchValue({
        name: this.category.name,
        slug: this.category.slug,
        description: this.category.description,
        isPublished: this.category.isPublished,
        isFeatured: this.category.isFeatured,
      });
    } else {
      this.form.controls.slug.valueChanges.subscribe(() => {
        this.slugTouchedByUser = true;
      });
      this.form.controls.name.valueChanges.subscribe((name) => {
        if (this.slugTouchedByUser) return;
        const generated = slugify(name ?? '');
        this.form.controls.slug.setValue(generated, { emitEvent: false });
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
    const payload: Partial<Category> = {
      name: raw.name,
      slug: raw.slug || undefined,
      description: raw.description,
      isPublished: raw.isPublished,
      isFeatured: raw.isFeatured,
    };

    const onSuccess = () => {
      this.submitting.set(false);
      this.close();
    };
    const onError = () => {
      // Keep the dialog open on failure so the user can fix and retry — the
      // toast (fired by CategoriesState) already surfaces the server message.
      this.submitting.set(false);
    };

    if (this.category) {
      this.state.updateCategory(this.category.id, payload, onSuccess, onError);
    } else {
      this.state.createCategory(payload, onSuccess, onError);
    }
  }

  onImageUpload(file: File): void {
    if (!this.category) return;
    this.imageBusy.set(true);
    this.state.uploadImage(
      this.category.id,
      file,
      (updated) => {
        this.imageUrl.set(updated.imageUrl);
        this.imageBusy.set(false);
      },
      () => this.imageBusy.set(false),
    );
  }

  onImageRemove(): void {
    if (!this.category) return;
    this.imageBusy.set(true);
    this.state.deleteImage(
      this.category.id,
      (updated) => {
        this.imageUrl.set(updated.imageUrl);
        this.imageBusy.set(false);
      },
      () => this.imageBusy.set(false),
    );
  }
}
