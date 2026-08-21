import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private readonly _labels = signal<Record<string, string>>({});
  readonly labels = this._labels.asReadonly();

  setLabel(segmentOrRoute: string, label: string): void {
    this._labels.update((prev) => ({
      ...prev,
      [segmentOrRoute]: label,
    }));
  }

  clearLabel(segmentOrRoute: string): void {
    this._labels.update((prev) => {
      const next = { ...prev };
      delete next[segmentOrRoute];
      return next;
    });
  }
}
