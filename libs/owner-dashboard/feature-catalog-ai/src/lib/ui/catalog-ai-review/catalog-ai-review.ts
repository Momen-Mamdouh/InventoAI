import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButton } from '@spartan/helm/button';
import { HlmCheckbox } from '@spartan/helm/checkbox';
import { HlmInput } from '@spartan/helm/input';
import {
  HlmSelect,
  HlmSelectContent,
  HlmSelectItem,
  HlmSelectPortal,
  HlmSelectTrigger,
  HlmSelectValue,
} from '@spartan/helm/select';
import { HlmSpinner } from '@spartan/helm/spinner';
import { HlmLabel } from '@spartan/helm/label';
import { HlmTextarea } from '@spartan/helm/textarea';
import { HlmH1, HlmH2, HlmH3, HlmMuted } from '@spartan/helm/typography';
import { toast } from '@spartan/helm/sonner';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideWand2, lucideLoader2, lucideAlertCircle, lucideCheck } from '@ng-icons/lucide';
import { LocaleService, TranslatePipe } from '@invento/shared-util-i18n';
import { extractErrorMessage } from '@invento/shared-util-error';
import { CatalogAiService } from '../../data-access/catalog-ai.service';
import {
  CatalogApplyRequest,
  GeneratedAttribute,
  GeneratedCategory,
} from '../../data-access/catalog-ai.model';

type WizardStatus = 'idle' | 'generating' | 'review' | 'applying' | 'success' | 'error';

interface SelectableCategory extends GeneratedCategory {
  selected?: boolean;
}
interface SelectableAttribute extends GeneratedAttribute {
  selected?: boolean;
}

@Component({
  selector: 'app-catalog-ai-review',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmButton,
    HlmInput,
    HlmCheckbox,
    HlmSelect,
    HlmSelectContent,
    HlmSelectItem,
    HlmSelectPortal,
    HlmSelectTrigger,
    HlmSelectValue,
    HlmSpinner,
    HlmLabel,
    HlmTextarea,
    HlmH1,
    HlmH2,
    HlmH3,
    HlmMuted,
    NgIcon,
    TranslatePipe,
  ],
  providers: [provideIcons({ lucideWand2, lucideLoader2, lucideAlertCircle, lucideCheck })],
  templateUrl: './catalog-ai-review.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogAiReview {
  private readonly catalogAiService = inject(CatalogAiService);
  private readonly router = inject(Router);
  private readonly localeService = inject(LocaleService);

  readonly status = signal<WizardStatus>('idle');
  readonly errorMessage = signal<string>('');
  readonly instructions = signal<string>('');

  readonly categories = signal<SelectableCategory[]>([]);
  readonly attributes = signal<SelectableAttribute[]>([]);

  readonly displayStyleItemToString = (value: unknown): string => {
    const key = String(value).toLowerCase();
    const translationKey = `catalog_ai.style_${key}`;
    const translated = this.localeService.translate(translationKey);
    if (translated && translated !== translationKey) {
      return translated;
    }
    const defaultLabels: Record<string, string> = {
      list: 'List',
      chip: 'Chip',
      dropdown: 'Dropdown',
      swatch: 'Swatch',
    };
    return defaultLabels[key] ?? 'List';
  };

  generateCatalog(): void {
    this.status.set('generating');
    this.errorMessage.set('');

    const payload = this.instructions() ? { instructions: this.instructions() } : {};

    this.catalogAiService.generateCatalog(payload).subscribe({
      next: (response) => {
        this.categories.set((response.categories || []).map((c) => ({ ...c, selected: true })));
        this.attributes.set((response.attributes || []).map((a) => ({ ...a, selected: true })));
        this.status.set('review');
      },
      error: (err: unknown) => {
        const message = extractErrorMessage(
          err,
          this.localeService.translate('catalog_ai.error_generate_failed'),
        );
        this.errorMessage.set(message);
        toast.error(message);
        this.status.set('error');
      },
    });
  }

  applyCatalog(): void {
    this.status.set('applying');
    this.errorMessage.set('');

    const request: CatalogApplyRequest = {
      categories: this.categories()
        .filter((c) => c.selected !== false)
        .map((c) => ({
          name: c.name,
          description: c.description === null ? undefined : c.description,
        })),
      attributes: this.attributes()
        .filter((a) => a.selected !== false)
        .map((a) => ({
          name: a.name,
          key: a.key,
          isVariantAxis: a.isVariantAxis,
          displayStyle: a.displayStyle,
          values: a.values.map((v) => ({
            value: v.value,
            swatchHex: v.swatchHex === null ? undefined : v.swatchHex,
          })),
        })),
    };

    this.catalogAiService.applyCatalog(request).subscribe({
      next: () => {
        toast.success(this.localeService.translate('catalog_ai.toast_applied'));
        this.status.set('success');
      },
      error: (err: unknown) => {
        const message = extractErrorMessage(
          err,
          this.localeService.translate('catalog_ai.error_apply_failed'),
        );
        this.errorMessage.set(message);
        toast.error(message);
        this.status.set('error');
      },
    });
  }

  reset(): void {
    this.status.set('idle');
    this.categories.set([]);
    this.attributes.set([]);
    this.instructions.set('');
    this.errorMessage.set('');
  }

  goToDashboard(): void {
    this.router.navigate(['/']);
  }
}
