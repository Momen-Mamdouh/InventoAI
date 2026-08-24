import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Preview } from './preview';
import {
  PreviewDataClient,
  BuilderState,
  ThemeItem,
} from '@invento/site-builder-data-access-builder';
import { LocaleService } from '@invento/shared-util-i18n';
import {
  MOCK_THEMES,
  MOCK_PREVIEW_PRODUCTS,
  MOCK_PREVIEW_TABS,
} from '@invento/shared-util-mock';

// Browser APIs not available in test environment
class MockObserver {
  observe() {
    /* noop */
  }
  disconnect() {
    /* noop */
  }
  unobserve() {
    /* noop */
  }
}
Object.defineProperty(globalThis, 'ResizeObserver', { value: MockObserver });
Object.defineProperty(globalThis, 'IntersectionObserver', { value: MockObserver });

// Mock Fullscreen API
Object.defineProperty(document, 'exitFullscreen', { value: vi.fn() });
Object.defineProperty(document, 'fullscreenElement', { value: null, writable: true });

describe('Preview', () => {
  let fixture: ComponentFixture<Preview>;
  let component: Preview;
  let builderState: BuilderState;

  beforeEach(async () => {
    // BuilderState persists to sessionStorage; keep tests isolated from each other.
    sessionStorage.clear();

    const mockLocale = {
      locale: vi.fn().mockReturnValue('en'),
      isRtl: vi.fn().mockReturnValue(false),
      translate: vi.fn((key: string, params?: Record<string, string | number>) => {
        const map: Record<string, string> = {
          build_items: `${params?.['n'] ?? 0} items`,
          build_skus: `${params?.['n'] ?? 0} SKUs`,
          build_routes: `${params?.['n'] ?? 0} routes`,
        };
        return map[key] ?? key;
      }),
    } as unknown as LocaleService;

    await TestBed.configureTestingModule({
      imports: [Preview],
      providers: [
        PreviewDataClient,
        BuilderState,
        { provide: LocaleService, useValue: mockLocale },
      ],
    }).compileComponents();

    builderState = TestBed.inject(BuilderState);

    // Preview's constructor calls loadThemes(), which short-circuits to
    // whatever Validation already fetched. Seeding here mirrors the real
    // navigation path and keeps the tests off the network — PreviewDataClient
    // no longer seeds itself with MOCK_THEMES, so without this the theme list
    // renders empty.
    builderState.themes.set(
      MOCK_THEMES.map((theme) => ({
        id: theme.id,
        name: theme.name,
        description: theme.description,
        style: 'default',
        font: 'inter',
        radius: theme.radius,
        light: theme.colors as unknown as Record<string, string>,
        dark: {},
        isSelected: false,
        css: {
          basePreset: theme.id,
          name: theme.name,
          description: theme.description,
          rawCss: '',
        },
      })) as unknown as ThemeItem[],
    );

    fixture = TestBed.createComponent(Preview);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders theme buttons', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.theme-color-btn');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('updates selectedTheme on theme click', () => {
    fixture.detectChanges();
    const themeButtons = fixture.nativeElement.querySelectorAll('.theme-color-btn');
    if (themeButtons.length > 1) {
      themeButtons[1].click();
      fixture.detectChanges();
      expect(component.activeTheme().id).toBe(MOCK_THEMES[1].id);
    }
  });

  it('opens deploy dialog', () => {
    fixture.detectChanges();
    const deployBtn = fixture.nativeElement.querySelector('#edit-profile');
    deployBtn.click();
    fixture.detectChanges();
    expect(component.deployDialogState()).toBe('open');
  });

  it('clears isNavigating when loading completes', () => {
    fixture.detectChanges();
    expect(builderState.isNavigating()).toBe(false);
  });

  it('toggles focus mode', () => {
    expect(component.focusMode()).toBe(false);
    component.toggleFocusMode();
    expect(component.focusMode()).toBe(true);
    (document as unknown as Record<string, unknown>)['fullscreenElement'] = null;
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(component.focusMode()).toBe(false);
  });

  it('exits focus mode on fullscreenchange', () => {
    component.focusMode.set(true);
    (document as unknown as Record<string, unknown>)['fullscreenElement'] = null;
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(component.focusMode()).toBe(false);
  });

  it('keeps a manually selected theme when the theme list changes', () => {
    fixture.detectChanges();

    const chosen = MOCK_THEMES[1];
    component.selectTheme(chosen);
    expect(component.activeTheme().id).toBe(chosen.id);

    // A late theme load must not silently reset the user's choice.
    TestBed.inject(PreviewDataClient).invalidate();
    fixture.detectChanges();

    expect(component.activeTheme().id).toBe(chosen.id);
  });

  it('computes brandName from BuilderState', () => {
    builderState.businessName.set('TestBrand');
    fixture.detectChanges();
    expect(component.brandName()).toBe('TestBrand');
  });

  it('computes featuredProduct from products', () => {
    fixture.detectChanges();
    expect(component.featuredProduct()).toEqual(MOCK_PREVIEW_PRODUCTS[0]);
  });

  it('computes dynamic buildSummary', () => {
    fixture.detectChanges();
    const summary = component.buildSummary();
    const variantsEntry = summary.find((s) => s.label === 'preview_variants');
    expect(variantsEntry?.value).toBe(`${MOCK_PREVIEW_PRODUCTS.length * 4} SKUs`);
    const pagesEntry = summary.find((s) => s.label === 'preview_pages');
    expect(pagesEntry?.value).toBe(`${MOCK_PREVIEW_TABS.length + 4} routes`);
  });
});
