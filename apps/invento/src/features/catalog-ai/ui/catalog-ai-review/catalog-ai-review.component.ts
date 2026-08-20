import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@spartan/helm/button';
import { HlmInputImports } from '@spartan/helm/input';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideWand2, lucideLoader2, lucideAlertCircle, lucideCheck } from '@ng-icons/lucide';
import { CatalogAiService } from '../../data-access/catalog-ai.service';
import {
  CatalogApplyRequest,
  GeneratedAttribute,
  GeneratedCategory,
} from '../../data-access/catalog-ai.model';

type WizardStatus = 'idle' | 'generating' | 'review' | 'applying' | 'success' | 'error';

interface SelectableCategory extends GeneratedCategory { selected?: boolean; }
interface SelectableAttribute extends GeneratedAttribute { selected?: boolean; }

@Component({
  selector: 'app-catalog-ai-review',
  standalone: true,
  imports: [CommonModule, FormsModule, HlmButtonImports, HlmInputImports, NgIcon],
  providers: [provideIcons({ lucideWand2, lucideLoader2, lucideAlertCircle, lucideCheck })],
  templateUrl: './catalog-ai-review.component.html',
})
export class CatalogAiReviewComponent {
  private catalogAiService = inject(CatalogAiService);
  private router = inject(Router);

  status = signal<WizardStatus>('idle');
  errorMessage = signal<string>('');
  instructions = signal<string>('');

  categories = signal<SelectableCategory[]>([]);
  attributes = signal<SelectableAttribute[]>([]);

  generateCatalog() {
    this.status.set('generating');
    this.errorMessage.set('');

    const payload = this.instructions() ? { instructions: this.instructions() } : {};

    this.catalogAiService.generateCatalog(payload).subscribe({
      next: (response) => {
        this.categories.set((response.categories || []).map(c => ({...c, selected: true})));
        this.attributes.set((response.attributes || []).map(a => ({...a, selected: true})));
        this.status.set('review');
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to generate catalog. Please try again.');
        this.status.set('error');
      },
    });
  }

  applyCatalog() {
    this.status.set('applying');
    this.errorMessage.set('');

    const request: CatalogApplyRequest = {
      categories: this.categories().filter(c => c.selected !== false).map(({ selected, ...c }) => ({
        ...c,
        description: c.description === null ? undefined : c.description
      })),
      attributes: this.attributes().filter(a => a.selected !== false).map(({ selected, ...a }) => ({
        ...a,
        values: a.values.map(v => ({
          ...v,
          swatchHex: v.swatchHex === null ? undefined : v.swatchHex
        }))
      })),
    };

    this.catalogAiService.applyCatalog(request).subscribe({
      next: (response) => {
        this.status.set('success');
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Failed to apply catalog. Please check your data.');
        this.status.set('error');
      },
    });
  }

  reset() {
    this.status.set('idle');
    this.categories.set([]);
    this.attributes.set([]);
    this.instructions.set('');
    this.errorMessage.set('');
  }

  goToDashboard() {
    this.router.navigate(['/']);
  }
}
