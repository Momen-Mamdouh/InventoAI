import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { App } from '../../app';
import { ThemeService } from '@invento/shared-util-theme';
import { LocaleService } from '@invento/shared-util-i18n';

describe('App Root Component', () => {
  let fixture: ComponentFixture<App>;
  let component: App;
  let isDarkSignal: ReturnType<typeof signal<boolean>>;
  let isRtlSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    isDarkSignal = signal(false);
    isRtlSignal = signal(false);

    const mockThemeService = {
      isDark: isDarkSignal,
      theme: signal('light'),
      setTheme: vi.fn(),
    };

    const mockLocaleService = {
      isRtl: isRtlSignal,
      locale: signal('en'),
      translate: vi.fn((k: string) => k),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: ThemeService, useValue: mockThemeService },
        { provide: LocaleService, useValue: mockLocaleService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates the application root', () => {
    expect(component).toBeTruthy();
  });

  it('computes toasterTheme based on themeService.isDark()', () => {
    fixture.detectChanges();
    expect((component as unknown as { toasterTheme: () => string }).toasterTheme()).toBe('light');

    isDarkSignal.set(true);
    fixture.detectChanges();
    expect((component as unknown as { toasterTheme: () => string }).toasterTheme()).toBe('dark');
  });

  it('computes toasterPosition based on localeService.isRtl()', () => {
    fixture.detectChanges();
    expect((component as unknown as { toasterPosition: () => string }).toasterPosition()).toBe(
      'bottom-right',
    );

    isRtlSignal.set(true);
    fixture.detectChanges();
    expect((component as unknown as { toasterPosition: () => string }).toasterPosition()).toBe(
      'bottom-left',
    );
  });

  it('sets isLoading to false after startup timeout', () => {
    vi.useFakeTimers();
    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const appRef = component as unknown as { isLoading: () => boolean };
    expect(appRef.isLoading()).toBe(true);

    vi.advanceTimersByTime(3000);
    fixture.detectChanges();
    expect(appRef.isLoading()).toBe(false);
    vi.useRealTimers();
  });
});
