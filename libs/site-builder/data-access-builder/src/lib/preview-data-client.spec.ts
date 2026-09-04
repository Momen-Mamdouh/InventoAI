import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PreviewDataClient } from './preview-data-client';
import { BuilderState } from './builder-state';
import { ThemeItem } from './themes-api';

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

    // BuilderState primes the question catalog from the backend the moment it
    // is constructed. Settle that request here so each test only reasons about
    // theme traffic, and afterEach's verify() stays meaningful.
    httpMock.match('/site-builder/questions').forEach((req) => req.flush({ questions: [] }));
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
    expect(service.themesUnavailable()).toBe(false);
  });

  it('reuses themes already fetched by Validation without calling the network', () => {
    builderState.themes.set([themeItem('uuid-cached')]);

    service.loadThemes();

    httpMock.expectNone(THEMES_ENDPOINT);
    expect(service.themeSuggestions()[0].id).toBe('uuid-cached');
    expect(service.themesUnavailable()).toBe(false);
  });

  it('caches fetched themes on BuilderState', () => {
    service.loadThemes();
    httpMock.expectOne(THEMES_ENDPOINT).flush({ themes: [themeItem('uuid-1')] });

    expect(builderState.themes().length).toBe(1);
  });

  it('offers nothing when the store has no themes yet', () => {
    service.loadThemes();
    httpMock.expectOne(THEMES_ENDPOINT).flush({ themes: [] });

    expect(service.themesUnavailable()).toBe(true);
    expect(service.themeError()).toBeTruthy();
    // No sample themes: an undeployable theme must never look selectable.
    expect(service.themeSuggestions().length).toBe(0);
  });

  it('offers nothing on a transport failure', () => {
    service.loadThemes();
    httpMock
      .expectOne(THEMES_ENDPOINT)
      .flush('Network error', { status: 500, statusText: 'Server Error' });

    expect(service.themesUnavailable()).toBe(true);
    expect(service.themeError()).toBeTruthy();
    expect(service.themeSuggestions().length).toBe(0);
  });

  it('refetches on reload() after a failure', () => {
    service.loadThemes();
    httpMock
      .expectOne(THEMES_ENDPOINT)
      .flush('Network error', { status: 500, statusText: 'Server Error' });
    expect(service.themesUnavailable()).toBe(true);

    service.reload();
    httpMock.expectOne(THEMES_ENDPOINT).flush({ themes: [themeItem('uuid-2')] });

    expect(service.themesUnavailable()).toBe(false);
    expect(service.themeSuggestions()[0].id).toBe('uuid-2');
  });

  it('sets _loaded flag and skips second call', () => {
    service.loadThemes();
    httpMock.expectOne(THEMES_ENDPOINT).flush({ themes: [themeItem('uuid-1')] });

    service.loadThemes();
    httpMock.expectNone(THEMES_ENDPOINT);
  });
});
