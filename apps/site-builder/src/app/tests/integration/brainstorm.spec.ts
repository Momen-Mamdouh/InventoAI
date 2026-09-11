import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { toast } from '@spartan/helm/sonner';
import { Brainstorm } from '@invento/site-builder-feature-builder';
import { BuilderState, BrainstormApi } from '@invento/site-builder-data-access-builder';
import { LocaleService } from '@invento/shared-util-i18n';
import { SITE_BUILDER_ENVIRONMENT } from '@invento/site-builder-data-access-preview';
import { HttpClientTestingModule } from '@angular/common/http/testing';

class MockObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}
Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: MockObserver,
  configurable: true,
});
Object.defineProperty(globalThis, 'ResizeObserver', { value: MockObserver, configurable: true });
Element.prototype.scrollIntoView = vi.fn();

describe('Brainstorm Component Integration', () => {
  let fixture: ComponentFixture<Brainstorm>;
  let component: Brainstorm;
  let builderState: BuilderState;
  let brainstormApiMock: { analyzePrompt: ReturnType<typeof vi.fn> };
  let router: Router;
  let toastErrorSpy: ReturnType<typeof vi.spyOn>;
  let toastInfoSpy: ReturnType<typeof vi.spyOn>;
  let toastSuccessSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    sessionStorage.clear();

    brainstormApiMock = {
      analyzePrompt: vi.fn().mockReturnValue(
        of({
          questions: [
            { questionId: 'q1', answer: 'Decoded Brand Name' },
            { questionId: 'q2', answer: 'Apparel' },
          ],
        }),
      ),
    };

    const mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => `translated_${k}`),
    };

    toastErrorSpy = vi.spyOn(toast, 'error').mockImplementation(() => '');
    toastInfoSpy = vi.spyOn(toast, 'info').mockImplementation(() => '');
    toastSuccessSpy = vi.spyOn(toast, 'success').mockImplementation(() => '');

    await TestBed.configureTestingModule({
      imports: [Brainstorm, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        BuilderState,
        { provide: BrainstormApi, useValue: brainstormApiMock },
        {
          provide: SITE_BUILDER_ENVIRONMENT,
          useValue: {
            production: false,
            apiUrl: 'http://localhost:3000',
            dashboardUrl: 'http://localhost:4200',
          },
        },
        { provide: LocaleService, useValue: mockLocaleService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Brainstorm);
    component = fixture.componentInstance;
    builderState = TestBed.inject(BuilderState);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    toastErrorSpy.mockRestore();
    toastInfoSpy.mockRestore();
    toastSuccessSpy.mockRestore();
    TestBed.resetTestingModule();
  });

  it('creates the brainstorm component', () => {
    expect(component).toBeTruthy();
  });

  describe('Form & Validation computations', () => {
    it('evaluates EMPTY validation status when input is empty', () => {
      component.descriptionControl.setValue('');
      expect(component.validationStatus()).toBe('EMPTY');
      expect(component.isValidConcept()).toBe(false);
      expect(component.charCount()).toBe(0);
      expect(component.wordCount()).toBe(0);
    });

    it('evaluates TOO_SHORT when input is less than MIN_BRAINSTORM_LENGTH', () => {
      component.descriptionControl.setValue('Short text');
      expect(component.validationStatus()).toBe('TOO_SHORT');
      expect(component.isValidConcept()).toBe(false);
    });

    it('evaluates MEANINGLESS when input contains repeated chars or too few words', () => {
      component.descriptionControl.setValue('aaaaaaaaaaaaaaaaaaaaaaaaa');
      expect(component.validationStatus()).toBe('MEANINGLESS');
      expect(component.isValidConcept()).toBe(false);

      component.descriptionControl.setValue('word1 word2 a a a a a a a a a a');
      expect(component.validationStatus()).toBe('MEANINGLESS');
    });

    it('evaluates VALID when concept has sufficient length and unique words', () => {
      component.descriptionControl.setValue(
        'An artisan leather handbag store designed for young professionals.',
      );
      expect(component.validationStatus()).toBe('VALID');
      expect(component.isValidConcept()).toBe(true);
      expect(component.readingTime()).toBeGreaterThanOrEqual(1);
      expect(component.progressValue()).toBeGreaterThan(50);
    });

    it('evaluates checklist fulfillment keywords', () => {
      component.descriptionControl.setValue(
        'A luxury brand store targeting Gen Z customers with premium price and modern bold style.',
      );
      const checks = component.checklistFulfillment();
      expect(checks[1]).toBe(true); // store/brand
      expect(checks[2]).toBe(true); // customer/audience
      expect(checks[3]).toBe(true); // price/premium
      expect(checks[4]).toBe(true); // personality/style
      expect(component.fulfilledCount()).toBe(4);
    });

    it('applies starter chips to the description control', () => {
      component.applyStarterChip(component.starterChips[0]);
      expect(component.descriptionControl.value).toBe('translated_chip_fashion_text');
      expect(component.descriptionControl.dirty).toBe(true);
    });
  });

  describe('Zen Studio Mode & Shortcuts', () => {
    it('opens and closes zen mode', () => {
      expect(component.isFocused()).toBe(false);
      component.openZenStudio();
      expect(component.isFocused()).toBe(true);
      component.closeZenStudio();
      expect(component.isFocused()).toBe(false);
    });

    it('closes zen mode on escape key press', () => {
      component.openZenStudio();
      expect(component.isFocused()).toBe(true);

      component.onEscape();
      expect(component.isFocused()).toBe(false);
    });

    it('syncs onZenDialogStateChanged', () => {
      component.onZenDialogStateChanged('open');
      expect(component.isFocused()).toBe(true);
      component.onZenDialogStateChanged('closed');
      expect(component.isFocused()).toBe(false);
    });
  });

  describe('Logo handling & validation', () => {
    it('rejects invalid file MIME type', () => {
      const invalidFile = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
      (component as unknown as { handleFile: (f: File) => void }).handleFile(invalidFile);

      expect(toastErrorSpy).toHaveBeenCalledWith('translated_toast_invalid_image');
      expect(component.hasValidLogo()).toBe(false);
    });

    it('rejects file larger than MAX_FILE_SIZE (5MB)', () => {
      const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.png', {
        type: 'image/png',
      });
      (component as unknown as { handleFile: (f: File) => void }).handleFile(largeFile);

      expect(toastErrorSpy).toHaveBeenCalledWith('translated_toast_file_size');
      expect(component.hasValidLogo()).toBe(false);
    });

    it('accepts valid png and sets logo preview and builderState', () => {
      const validFile = new File(['fake-png-data'], 'logo.png', { type: 'image/png' });
      (component as unknown as { handleFile: (f: File) => void }).handleFile(validFile);

      expect(component.logoFile()).toBe(validFile);
      expect(builderState.hasLogo()).toBe(true);
      expect(component.hasValidLogo()).toBe(true);
    });

    it('removes logo and clears preview and state', () => {
      const validFile = new File(['fake-png-data'], 'logo.png', { type: 'image/png' });
      (component as unknown as { handleFile: (f: File) => void }).handleFile(validFile);
      expect(component.hasValidLogo()).toBe(true);

      component.removeLogo();
      expect(component.logoFile()).toBeNull();
      expect(component.logoPreview()).toBeNull();
      expect(builderState.hasLogo()).toBe(false);
      expect(builderState.logoUrl()).toBeNull();
      expect(component.hasValidLogo()).toBe(false);
    });

    it('handles drag and drop events', () => {
      const dragOverEvent = { preventDefault: vi.fn() } as unknown as DragEvent;
      component.onDragOver(dragOverEvent);
      expect(component.isDragging()).toBe(true);

      const dragLeaveEvent = { preventDefault: vi.fn() } as unknown as DragEvent;
      component.onDragLeave(dragLeaveEvent);
      expect(component.isDragging()).toBe(false);
    });

    it('handles onDrop with valid file and resets isDragging', () => {
      const validFile = new File(['fake-png-data'], 'logo.png', { type: 'image/png' });
      const dropEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { files: [validFile] },
      } as unknown as DragEvent;

      component.onDrop(dropEvent);
      expect(component.isDragging()).toBe(false);
      expect(component.logoFile()).toBe(validFile);
    });

    it('handles onFileSelected from file input', () => {
      const validFile = new File(['fake-png-data'], 'logo.png', { type: 'image/png' });
      const changeEvent = {
        target: { files: [validFile] },
      } as unknown as Event;

      component.onFileSelected(changeEvent);
      expect(component.logoFile()).toBe(validFile);
    });

    it('handles onEscape to blur focused description', () => {
      component.isFocused.set(true);
      component.onEscape();
      expect(component.isFocused()).toBe(false);
    });
  });

  describe('Step enforcement highlighting', () => {
    it('highlights logo dropzone when logo is missing upon enforcement', () => {
      builderState.hasLogo.set(false);
      component.descriptionControl.setValue('Valid long description for my store');

      (component as unknown as { handleEnforcement: () => void }).handleEnforcement();
      expect(component.highlightErrorElement()).toBe('logo');
    });

    it('highlights description when concept is invalid upon enforcement', () => {
      builderState.hasLogo.set(true);
      component.descriptionControl.setValue('');

      (component as unknown as { handleEnforcement: () => void }).handleEnforcement();
      expect(component.highlightErrorElement()).toBe('desc');
    });

    it('highlights initiate button when prompt is not yet analyzed', () => {
      builderState.hasLogo.set(true);
      component.descriptionControl.setValue('A valid business concept for custom leather bags');
      builderState.brainstormAnalyzed.set(false);

      (component as unknown as { handleEnforcement: () => void }).handleEnforcement();
      expect(component.highlightErrorElement()).toBe('initiate');
    });
  });

  describe('Form Submission & Flow', () => {
    it('blocks onNext if concept or logo is invalid', () => {
      component.descriptionControl.setValue('');
      builderState.hasLogo.set(false);

      component.onNext();
      expect(toastErrorSpy).toHaveBeenCalledWith('translated_brainstorm_logo_required');
      expect(brainstormApiMock.analyzePrompt).not.toHaveBeenCalled();
    });

    it('fast-paths to ai-interview if brainstorm was already analyzed and unchanged', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const validText = 'An artisan coffee shop focused on single-origin roasts.';
      component.descriptionControl.setValue(validText);
      builderState.brainstorm.set(validText);
      builderState.brainstormAnalyzed.set(true);
      builderState.hasLogo.set(true);

      component.onNext();

      expect(toastInfoSpy).toHaveBeenCalledWith('translated_brainstorm_resumed_notice');
      expect(navigateSpy).toHaveBeenCalledWith(['/build/ai-interview']);
      expect(brainstormApiMock.analyzePrompt).not.toHaveBeenCalled();
    });

    it('calls brainstormApi.analyzePrompt and stores questions prefill on success', async () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      const validText = 'A modern activewear clothing store for athletes.';
      component.descriptionControl.setValue(validText);
      builderState.brainstorm.set('Older different text');
      builderState.brainstormAnalyzed.set(false);
      builderState.hasLogo.set(true);

      component.onNext();
      expect(component.isSubmitting()).toBe(true);

      await new Promise((r) => setTimeout(r, 950));

      expect(brainstormApiMock.analyzePrompt).toHaveBeenCalledWith(validText, undefined);
      expect(builderState.aiAnswers()).toEqual({
        q1: 'Decoded Brand Name',
        q2: 'Apparel',
      });
      expect(builderState.brainstormAnalyzed()).toBe(true);
      expect(component.isSubmitting()).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/build/ai-interview']);
      expect(toastSuccessSpy).toHaveBeenCalledWith('translated_toast_prompt_success');
    });

    it('handles api error during prompt analysis', async () => {
      brainstormApiMock.analyzePrompt.mockReturnValue(throwError(() => new Error('Server error')));
      const validText = 'A modern activewear clothing store for athletes.';
      component.descriptionControl.setValue(validText);
      builderState.hasLogo.set(true);

      component.onNext();
      await new Promise((r) => setTimeout(r, 950));

      expect(component.isSubmitting()).toBe(false);
      expect(toastErrorSpy).toHaveBeenCalled();
    });
  });
});
