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
import { lucideX, lucideCheck, lucideLoader2 } from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { HlmInput } from '@spartan/helm/input';
import {
  HlmSheet,
  HlmSheetContent,
  HlmSheetDescription,
  HlmSheetFooter,
  HlmSheetHeader,
  HlmSheetPortal,
  HlmSheetTitle,
} from '@spartan/helm/sheet';
import { HlmTextarea } from '@spartan/helm/textarea';
import { Category, CategoriesState } from '@invento/owner-dashboard-data-access-category';
import { HlmLabel } from '@spartan/helm/label';
import { HlmSwitch } from '@spartan/helm/switch';
import { ImageUpload } from './image-upload';
import { TranslatePipe } from '@invento/shared-util-i18n';

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
    HlmButton,
    HlmInput,
    HlmSheet,
    HlmSheetContent,
    HlmSheetHeader,
    HlmSheetTitle,
    HlmSheetDescription,
    HlmSheetFooter,
    HlmSheetPortal,
    HlmTextarea,
    HlmLabel,
    HlmSwitch,
    ImageUpload,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucideX, lucideCheck, lucideLoader2 })],
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
        if (this.slugTouchedByUser) {
          return;
        }
        const generated = slugify(name ?? '');
        this.form.controls.slug.setValue(generated, { emitEvent: false });
      });
    }
  }

  onStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') {
      this.close();
    }
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

    const onSuccess = (): void => {
      this.submitting.set(false);
      this.close();
    };
    const onError = (): void => {
      // Keep the drawer open on failure so the user can fix and retry — the
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
    if (!this.category) {
      return;
    }
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
    if (!this.category) {
      return;
    }
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
