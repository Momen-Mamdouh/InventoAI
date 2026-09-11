import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, PLATFORM_ID } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import {
  Hero,
  Pipeline,
  Stats,
  BlurText,
  ProTextAnim,
  StyleTest,
  TypingText,
} from '@invento/site-builder-feature-home';
import { MainLayout, AuthLayout } from '@invento/site-builder-feature-shell';
import { LocaleService } from '@invento/shared-util-i18n';
import { AuthService } from '@invento/shared-data-access-auth';
import { SITE_BUILDER_ENVIRONMENT } from '@invento/site-builder-data-access-preview';

class MockObserver {
  private cb: (entries: { isIntersecting: boolean }[]) => void;
  constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
    this.cb = callback;
  }
  observe() {
    this.cb([{ isIntersecting: true }]);
  }
  disconnect = vi.fn();
  unobserve = vi.fn();
}

describe('Home Sections and Shell Layouts Integration', () => {
  const mockLocaleService = {
    isRtl: signal(false),
    locale: signal('en'),
    translate: vi.fn((k: string) => `trans_${k}`),
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      value: MockObserver,
      configurable: true,
    });
  });

  describe('Hero Component', () => {
    let fixture: ComponentFixture<Hero>;
    let component: Hero;
    let router: Router;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [Hero],
        providers: [provideRouter([]), { provide: LocaleService, useValue: mockLocaleService }],
      }).compileComponents();

      fixture = TestBed.createComponent(Hero);
      component = fixture.componentInstance;
      router = TestBed.inject(Router);
    });

    it('creates hero component and navigates on get started', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      expect(component).toBeTruthy();
      component.handleGetStarted();
      expect(navigateSpy).toHaveBeenCalledWith(['/build']);
    });
  });

  describe('Pipeline Component', () => {
    let fixture: ComponentFixture<Pipeline>;
    let component: Pipeline;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [Pipeline],
        providers: [provideRouter([]), { provide: LocaleService, useValue: mockLocaleService }],
      }).compileComponents();

      fixture = TestBed.createComponent(Pipeline);
      component = fixture.componentInstance;
    });

    it('creates pipeline component and handles mouse move glow effects', () => {
      expect(component).toBeTruthy();
      const card = document.createElement('div');
      const glow = document.createElement('div');
      glow.className = 'pipeline-glow';
      card.appendChild(glow);
      card.getBoundingClientRect = () =>
        ({ left: 10, top: 10, width: 200, height: 100 }) as DOMRect;

      const moveEv = { currentTarget: card, clientX: 50, clientY: 40 } as unknown as MouseEvent;
      component.onMouseMove(moveEv);
      expect(glow.style.opacity).toBe('0.08');
      expect(glow.style.background).toContain('radial-gradient');

      const leaveEv = { currentTarget: card } as unknown as MouseEvent;
      component.onMouseLeave(leaveEv);
      expect(glow.style.opacity).toBe('0');
    });

    it('gracefully handles mouse events on elements without glow child', () => {
      const card = document.createElement('div');
      const moveEv = { currentTarget: card, clientX: 50, clientY: 40 } as unknown as MouseEvent;
      expect(() => component.onMouseMove(moveEv)).not.toThrow();

      const leaveEv = { currentTarget: card } as unknown as MouseEvent;
      expect(() => component.onMouseLeave(leaveEv)).not.toThrow();
    });
  });

  describe('Stats Component', () => {
    it('initializes in browser environment and runs observer', () => {
      const fixture = TestBed.createComponent(Stats);
      const comp = fixture.componentInstance;
      fixture.detectChanges();
      expect(comp).toBeTruthy();
      fixture.destroy();
    });

    it('runs counter interval until completion and clears timers', async () => {
      const fixture = TestBed.createComponent(Stats);
      const comp = fixture.componentInstance;
      fixture.detectChanges();

      await new Promise((r) => setTimeout(r, 1900));
      const stats = (comp as unknown as { displayStats: () => { value: string }[] }).displayStats();
      expect(Number(stats[0].value)).toBeGreaterThanOrEqual(3);
      fixture.destroy();
    });

    it('initializes in non-browser environment with static string values', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [Stats],
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: LocaleService, useValue: mockLocaleService },
        ],
      });

      const fixture = TestBed.createComponent(Stats);
      const comp = fixture.componentInstance;
      fixture.detectChanges();
      expect(comp).toBeTruthy();
    });
  });

  describe('BlurText Component', () => {
    let fixture: ComponentFixture<BlurText>;
    let component: BlurText;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [BlurText],
        providers: [
          { provide: LocaleService, useValue: mockLocaleService },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(BlurText);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('texts', ['Hello World', 'Welcome Home']);
      fixture.detectChanges();
    });

    it('splits text by words and advances to next word', () => {
      fixture.componentRef.setInput('animateBy', 'words');
      fixture.detectChanges();
      const elems = (
        component as unknown as { elements: () => { text: string; needsSpace: boolean }[] }
      ).elements();
      expect(elems.length).toBeGreaterThan(0);

      component.next();
      component.ngOnDestroy();
    });

    it('splits text by letters', () => {
      fixture.componentRef.setInput('animateBy', 'letters');
      fixture.detectChanges();
      const elems = (
        component as unknown as { elements: () => { text: string; needsSpace: boolean }[] }
      ).elements();
      expect(elems.length).toBeGreaterThan(0);
      component.ngOnDestroy();
    });
  });

  describe('ProTextAnim Component', () => {
    let fixture: ComponentFixture<ProTextAnim>;
    let component: ProTextAnim;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ProTextAnim],
        providers: [{ provide: LocaleService, useValue: mockLocaleService }],
      }).compileComponents();

      fixture = TestBed.createComponent(ProTextAnim);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('words', ['Invento', 'AI']);
      fixture.componentRef.setInput('intervalTime', 100);
      fixture.componentRef.setInput('scrambleDuration', 60);
      fixture.detectChanges();
    });

    it('creates pro-text-anim and handles scrambling lifecycle', async () => {
      expect(component).toBeTruthy();
      await new Promise((r) => setTimeout(r, 150));
      component.ngOnDestroy();
    });
  });

  describe('TypingText Component', () => {
    let fixture: ComponentFixture<TypingText>;
    let component: TypingText;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TypingText],
        providers: [{ provide: LocaleService, useValue: mockLocaleService }],
      }).compileComponents();

      fixture = TestBed.createComponent(TypingText);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('words', ['Hi', 'Store']);
      fixture.componentRef.setInput('typingSpeed', 15);
      fixture.componentRef.setInput('deletingSpeed', 15);
      fixture.componentRef.setInput('pauseAfterType', 30);
      fixture.componentRef.setInput('pauseAfterDelete', 30);
      fixture.detectChanges();
    });

    it('types and deletes words across intervals', async () => {
      expect(component).toBeTruthy();
      await new Promise((r) => setTimeout(r, 260));
      component.ngOnDestroy();
    });
  });

  describe('StyleTest Component', () => {
    it('toggles dark mode and sets active style', () => {
      const fixture = TestBed.createComponent(StyleTest);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.isDark()).toBe(false);
      component.toggleDarkMode();
      expect(component.isDark()).toBe(true);

      component.setStyle('nova');
      expect(component.activeStyle()).toBe('nova');
    });
  });

  describe('Shell Layouts (MainLayout & AuthLayout)', () => {
    it('creates MainLayout successfully', () => {
      TestBed.resetTestingModule();
      const mockAuthService = {
        currentUser: signal(null),
        isAuthenticated: signal(false),
        getStoreSlug: () => null,
      };
      TestBed.configureTestingModule({
        imports: [MainLayout],
        providers: [
          provideRouter([]),
          { provide: LocaleService, useValue: mockLocaleService },
          { provide: AuthService, useValue: mockAuthService },
          {
            provide: SITE_BUILDER_ENVIRONMENT,
            useValue: {
              production: false,
              apiUrl: 'http://localhost:3000',
              dashboardUrl: 'http://localhost:4200',
            },
          },
        ],
      });
      const fixture = TestBed.createComponent(MainLayout);
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('creates AuthLayout successfully', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AuthLayout],
        providers: [provideRouter([]), { provide: LocaleService, useValue: mockLocaleService }],
      });
      const fixture = TestBed.createComponent(AuthLayout);
      expect(fixture.componentInstance).toBeTruthy();
    });
  });
});
