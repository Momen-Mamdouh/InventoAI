import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PreviewDataClient } from './preview-data-client';
import { BuilderState } from '@/app/features/builder/services/builder-state';
import { ThemeItem } from '@/app/features/builder/services/themes-api';

const THEMES_ENDPOINT = '/site-builder/themes';

function themeItem(id: string, name = 'Backend Theme'): ThemeItem {
  return {
    id,
    name,
    description: 'from the backend',
    style: 'default',
    font: 'inter',
    radius: '0.5rem',
    light: { background: '#ffffff', primary: '#111111' },
    dark: { background: '#000000', primary: '#eeeeee' },
    isSelected: false,
    css: { basePreset: 'default', name, description: '', rawCss: '' },
  } as unknown as ThemeItem;
}

describe('PreviewDataClient', () => {
  let service: PreviewDataClient;
  let httpMock: HttpTestingController;
  let builderState: BuilderState;

  beforeEach(() => {
    // BuilderState persists to sessionStorage; keep tests isolated from each other.
    sessionStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PreviewDataClient, BuilderState],
    });

    service = TestBed.inject(PreviewDataClient);
    httpMock = TestBed.inject(HttpTestingController);
    builderState = TestBed.inject(BuilderState);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sets isLoading to true then false on loadThemes', () => {
    service.loadThemes();
    expect(service.isLoading()).toBe(true);

    httpMock.expectOne(THEMES_ENDPOINT).flush({ themes: [themeItem('uuid-1')] });
    expect(service.isLoading()).toBe(false);
  });

  it('publishes the backend themes and keeps their real ids', () => {
    service.loadThemes();
    httpMock.expectOne(THEMES_ENDPOINT).flush({ themes: [themeItem('uuid-1', 'Ocean')] });

    const suggestions = service.themeSuggestions();
    expect(suggestions.length).toBe(1);
    // The id must survive untouched — publish sends it as themeId, and the
    // backend rejects anything that is not the store theme's UUID.
    expect(suggestions[0].id).toBe('uuid-1');
    expect(service.usingFallbackThemes()).toBe(false);
  });

  it('reuses themes already fetched by Validation without calling the network', () => {
    builderState.themes.set([themeItem('uuid-cached')]);

    service.loadThemes();

    httpMock.expectNone(THEMES_ENDPOINT);
    expect(service.themeSuggestions()[0].id).toBe('uuid-cached');
    expect(service.usingFallbackThemes()).toBe(false);
  });

  it('caches fetched themes on BuilderState', () => {
    service.loadThemes();
    httpMock.expectOne(THEMES_ENDPOINT).flush({ themes: [themeItem('uuid-1')] });

    expect(builderState.themes().length).toBe(1);
  });

  it('flags fallback themes when the store has none yet', () => {
    service.loadThemes();
    httpMock.expectOne(THEMES_ENDPOINT).flush({ themes: [] });

    expect(service.usingFallbackThemes()).toBe(true);
    expect(service.themeError()).toBeTruthy();
    expect(service.themeSuggestions().length).toBeGreaterThan(0);
  });

  it('flags fallback themes on a transport failure', () => {
    service.loadThemes();
    httpMock
      .expectOne(THEMES_ENDPOINT)
      .flush('Network error', { status: 500, statusText: 'Server Error' });

    expect(service.usingFallbackThemes()).toBe(true);
    expect(service.themeError()).toBeTruthy();
    expect(service.themeSuggestions().length).toBeGreaterThan(0);
  });

  it('sets _loaded flag and skips second call', () => {
    service.loadThemes();
    httpMock.expectOne(THEMES_ENDPOINT).flush({ themes: [themeItem('uuid-1')] });

    service.loadThemes();
    httpMock.expectNone(THEMES_ENDPOINT);
  });
});
