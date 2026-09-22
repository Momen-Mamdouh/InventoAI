import { signal, computed, Signal, WritableSignal } from '@angular/core';
import { toast } from '@spartan/helm/sonner';
import {
  StoreService,
  HeroSectionResponse,
} from '@invento/owner-dashboard-data-access-store';

export interface HeroState {
  imageUrl: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface UseHeroEditorReturn {
  imageUrl: WritableSignal<string>;
  title: WritableSignal<string>;
  subtitle: WritableSignal<string>;
  ctaLabel: WritableSignal<string>;
  ctaHref: WritableSignal<string>;
  heroImageFile: WritableSignal<File | null>;
  isSaving: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  isDirty: Signal<boolean>;
  hasUnsavedChanges: Signal<boolean>;
  lastSavedAt: WritableSignal<Date | null>;
  saveHistory: WritableSignal<HeroState[]>;
  historyIndex: WritableSignal<number>;
  canUndo: Signal<boolean>;
  canRedo: Signal<boolean>;

  setField(field: keyof HeroState, value: string): void;
  onFileSelected(file: File, onLoad: (result: string) => void): void;
  save(storeService: StoreService): void;
  discard(snapshot: HeroState): void;
  undo(): void;
  redo(): void;
  pushHistory(): void;
  loadFromResponse(res: HeroSectionResponse): void;
  openCta(): void;
  fallbackImage(): void;
}

export function useHeroEditor(defaults: HeroState): UseHeroEditorReturn {
  const imageUrl = signal<string>(defaults.imageUrl);
  const title = signal<string>(defaults.title);
  const subtitle = signal<string>(defaults.subtitle);
  const ctaLabel = signal<string>(defaults.ctaLabel);
  const ctaHref = signal<string>(defaults.ctaHref);
  const heroImageFile = signal<File | null>(null);
  const isSaving = signal<boolean>(false);
  const error = signal<string | null>(null);
  const isDirty = signal<boolean>(false);
  const lastSavedAt = signal<Date | null>(null);
  const saveHistory = signal<HeroState[]>([defaults]);
  const historyIndex = signal<number>(0);

  const hasUnsavedChanges = computed(() => isDirty());
  const canUndo = computed(() => historyIndex() > 0);
  const canRedo = computed(() => historyIndex() < saveHistory().length - 1);

  function pushHistory(): void {
    const state: HeroState = {
      imageUrl: imageUrl(),
      title: title(),
      subtitle: subtitle(),
      ctaLabel: ctaLabel(),
      ctaHref: ctaHref(),
    };
    const current = historyIndex();
    const history = saveHistory().slice(0, current + 1);
    history.push(state);
    saveHistory.set(history);
    historyIndex.set(history.length - 1);
  }

  function setField(field: keyof HeroState, value: string): void {
    switch (field) {
      case 'imageUrl':
        imageUrl.set(value);
        break;
      case 'title':
        title.set(value);
        break;
      case 'subtitle':
        subtitle.set(value);
        break;
      case 'ctaLabel':
        ctaLabel.set(value);
        break;
      case 'ctaHref':
        ctaHref.set(value);
        break;
    }
    isDirty.set(true);
  }

  function onFileSelected(file: File, onLoad: (result: string) => void): void {
    heroImageFile.set(file);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      imageUrl.set(result);
      isDirty.set(true);
      onLoad(result);
    };
    reader.readAsDataURL(file);
  }

  function loadFromResponse(res: HeroSectionResponse): void {
    if (res.imageUrl) imageUrl.set(res.imageUrl);
    if (res.headline) title.set(res.headline);
    if (res.subtitle) subtitle.set(res.subtitle);
    if (res.ctaLabel) ctaLabel.set(res.ctaLabel);
    ctaHref.set(res.ctaHref || '');
    pushHistory();
    isDirty.set(false);
    lastSavedAt.set(new Date());
  }

  function save(storeService: StoreService): void {
    const currentState: HeroState = {
      imageUrl: imageUrl(),
      title: title(),
      subtitle: subtitle(),
      ctaLabel: ctaLabel(),
      ctaHref: ctaHref(),
    };

    isSaving.set(true);
    error.set(null);

    const formData = new FormData();
    formData.append('headline', title());
    formData.append('subtitle', subtitle());
    formData.append('ctaLabel', ctaLabel());
    formData.append('ctaHref', ctaHref());

    const file = heroImageFile();
    if (file) {
      formData.append('image', file);
    }

    storeService.updateHero(formData).subscribe({
      next: (res) => {
        heroImageFile.set(null);
        loadFromResponse(res);
        isSaving.set(false);
        toast.success('Hero section updated successfully');
      },
      error: (err) => {
        const message =
          err.error?.message || err.message || 'Failed to update hero section. Please try again.';
        error.set(message);
        isSaving.set(false);
        imageUrl.set(currentState.imageUrl);
        title.set(currentState.title);
        subtitle.set(currentState.subtitle);
        ctaLabel.set(currentState.ctaLabel);
        ctaHref.set(currentState.ctaHref);
        toast.error(message);
      },
    });
  }

  function discard(snapshot: HeroState): void {
    imageUrl.set(snapshot.imageUrl);
    title.set(snapshot.title);
    subtitle.set(snapshot.subtitle);
    ctaLabel.set(snapshot.ctaLabel);
    ctaHref.set(snapshot.ctaHref);
    heroImageFile.set(null);
    error.set(null);
    isDirty.set(false);
  }

  function undo(): void {
    if (!canUndo()) return;
    pushHistory();
    const idx = historyIndex() - 2;
    if (idx >= 0) {
      const prev = saveHistory()[idx];
      imageUrl.set(prev.imageUrl);
      title.set(prev.title);
      subtitle.set(prev.subtitle);
      ctaLabel.set(prev.ctaLabel);
      ctaHref.set(prev.ctaHref);
      historyIndex.set(idx);
      isDirty.set(true);
    }
  }

  function redo(): void {
    if (!canRedo()) return;
    const idx = historyIndex() + 1;
    if (idx < saveHistory().length) {
      const next = saveHistory()[idx];
      imageUrl.set(next.imageUrl);
      title.set(next.title);
      subtitle.set(next.subtitle);
      ctaLabel.set(next.ctaLabel);
      ctaHref.set(next.ctaHref);
      historyIndex.set(idx);
      isDirty.set(true);
    }
  }

  function openCta(): void {
    const href = ctaHref().trim();
    if (href) {
      window.open(href, '_blank');
    }
  }

  function fallbackImage(): void {
    imageUrl.set('');
  }

  return {
    imageUrl,
    title,
    subtitle,
    ctaLabel,
    ctaHref,
    heroImageFile,
    isSaving,
    error,
    isDirty,
    hasUnsavedChanges,
    lastSavedAt,
    saveHistory,
    historyIndex,
    canUndo,
    canRedo,
    setField,
    onFileSelected,
    save,
    discard,
    undo,
    redo,
    pushHistory,
    loadFromResponse,
    openCta,
    fallbackImage,
  };
}
