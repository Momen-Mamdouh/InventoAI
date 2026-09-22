import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { useHeroEditor, HeroState } from '@invento/owner-dashboard-feature-home';
import { StoreService, HeroSectionResponse } from '@invento/owner-dashboard-data-access-store';

describe('useHeroEditor Composable Unit Tests', () => {
  const initialHero: HeroState = {
    imageUrl: 'https://example.com/banner.jpg',
    title: 'Transform Your Retail Experience',
    subtitle: 'AI-driven inventory intelligence',
    ctaLabel: 'Shop Now',
    ctaHref: '/products',
  };

  let storeServiceMock: {
    updateHero: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    storeServiceMock = {
      updateHero: vi.fn(),
    };
  });

  it('initializes editor signals with provided default values', () => {
    const editor = useHeroEditor(initialHero);

    expect(editor.imageUrl()).toBe(initialHero.imageUrl);
    expect(editor.title()).toBe(initialHero.title);
    expect(editor.subtitle()).toBe(initialHero.subtitle);
    expect(editor.ctaLabel()).toBe(initialHero.ctaLabel);
    expect(editor.ctaHref()).toBe(initialHero.ctaHref);
    expect(editor.isDirty()).toBe(false);
    expect(editor.hasUnsavedChanges()).toBe(false);
    expect(editor.canUndo()).toBe(false);
    expect(editor.canRedo()).toBe(false);
  });

  it('tracks dirty state when fields are modified via setField', () => {
    const editor = useHeroEditor(initialHero);

    editor.setField('title', 'Brand New Autumn Collection');

    expect(editor.title()).toBe('Brand New Autumn Collection');
    expect(editor.isDirty()).toBe(true);
    expect(editor.hasUnsavedChanges()).toBe(true);

    editor.setField('subtitle', 'Up to 50% discount on all lines');
    expect(editor.subtitle()).toBe('Up to 50% discount on all lines');

    editor.setField('ctaLabel', 'Discover Offers');
    expect(editor.ctaLabel()).toBe('Discover Offers');

    editor.setField('ctaHref', '/offers');
    expect(editor.ctaHref()).toBe('/offers');

    editor.setField('imageUrl', 'https://example.com/autumn.jpg');
    expect(editor.imageUrl()).toBe('https://example.com/autumn.jpg');
  });

  it('pushes history states and manages undo and redo navigation', () => {
    const editor = useHeroEditor(initialHero);

    editor.setField('title', 'Version 2');
    editor.pushHistory();

    expect(editor.canUndo()).toBe(true);
    expect(editor.canRedo()).toBe(false);

    editor.setField('title', 'Version 3');
    editor.pushHistory();

    expect(editor.canUndo()).toBe(true);

    editor.undo();
    expect(editor.title()).toBe('Version 2');
    expect(editor.canRedo()).toBe(true);

    editor.redo();
    expect(editor.title()).toBe('Version 3');
  });

  it('discards changes and reverts to given snapshot state', () => {
    const editor = useHeroEditor(initialHero);

    editor.setField('title', 'Temporary Untracked Title');
    expect(editor.isDirty()).toBe(true);

    editor.discard(initialHero);

    expect(editor.title()).toBe(initialHero.title);
    expect(editor.isDirty()).toBe(false);
    expect(editor.hasUnsavedChanges()).toBe(false);
  });

  it('saves successfully through storeService and marks state clean', () => {
    const editor = useHeroEditor(initialHero);
    const mockResponse: HeroSectionResponse = {
      imageUrl: 'https://example.com/saved.jpg',
      headline: 'Saved Headline',
      subtitle: 'Saved Subtitle',
      ctaLabel: 'Shop Now',
      ctaHref: '/products',
    };

    storeServiceMock.updateHero.mockReturnValue(of(mockResponse));

    editor.setField('title', 'Saved Headline');
    editor.save(storeServiceMock as unknown as StoreService);

    expect(storeServiceMock.updateHero).toHaveBeenCalled();
    expect(editor.isSaving()).toBe(false);
    expect(editor.isDirty()).toBe(false);
    expect(editor.title()).toBe('Saved Headline');
    expect(editor.lastSavedAt()).not.toBeNull();
  });

  it('reverts optimistic values and sets error signal when save fails', () => {
    const editor = useHeroEditor(initialHero);
    const errorResponse = { error: { message: 'Network timeout occurred' } };

    storeServiceMock.updateHero.mockReturnValue(throwError(() => errorResponse));

    editor.setField('title', 'Failed Title Edit');
    editor.save(storeServiceMock as unknown as StoreService);

    expect(storeServiceMock.updateHero).toHaveBeenCalled();
    expect(editor.isSaving()).toBe(false);
    expect(editor.error()).toBe('Network timeout occurred');
  });
});
