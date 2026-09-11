import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import {
  DraftApi,
  StoreApi,
  ThemesApi,
  PublishApi,
  DomainApi,
  BrainstormApi,
  AiInterviewApi,
  QuestionsApi,
  INTERVIEW_QUESTIONS,
  DraftResponse,
  StoreResponse,
  GetThemesResponse,
} from '@invento/site-builder-data-access-builder';
import { ApiConfig, SITE_BUILDER_ENVIRONMENT } from '@invento/site-builder-data-access-preview';

describe('SiteBuilder HTTP API Clients', () => {
  let httpMock: HttpTestingController;
  let apiConfig: ApiConfig;

  let draftApi: DraftApi;
  let storeApi: StoreApi;
  let themesApi: ThemesApi;
  let publishApi: PublishApi;
  let domainApi: DomainApi;
  let brainstormApi: BrainstormApi;
  let aiInterviewApi: AiInterviewApi;
  let questionsApi: QuestionsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: SITE_BUILDER_ENVIRONMENT,
          useValue: {
            production: false,
            apiUrl: 'http://localhost:3000/api',
            dashboardUrl: 'http://localhost:4400',
            loginUrl: 'http://localhost:4400/login',
          },
        },
        ApiConfig,
        DraftApi,
        StoreApi,
        ThemesApi,
        PublishApi,
        DomainApi,
        BrainstormApi,
        AiInterviewApi,
        QuestionsApi,
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    apiConfig = TestBed.inject(ApiConfig);

    draftApi = TestBed.inject(DraftApi);
    storeApi = TestBed.inject(StoreApi);
    themesApi = TestBed.inject(ThemesApi);
    publishApi = TestBed.inject(PublishApi);
    domainApi = TestBed.inject(DomainApi);
    brainstormApi = TestBed.inject(BrainstormApi);
    aiInterviewApi = TestBed.inject(AiInterviewApi);
    questionsApi = TestBed.inject(QuestionsApi);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('DraftApi', () => {
    it('fetches draft and returns draft data on 200 OK', () => {
      const mockDraft: DraftResponse = {
        brainstorm: 'Test Concept',
        logoUrl: null,
        answers: [],
        businessName: 'Acme',
        slug: 'acme',
        step: 'brainstormed',
      };

      draftApi.getDraft().subscribe((res) => {
        expect(res).toEqual(mockDraft);
      });

      const req = httpMock.expectOne(apiConfig.url('/site-builder/draft'));
      expect(req.request.method).toBe('GET');
      req.flush(mockDraft);
    });

    it('returns null on error or 500 without crashing', () => {
      draftApi.getDraft().subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(apiConfig.url('/site-builder/draft'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('StoreApi', () => {
    it('fetches store and returns StoreResponse on 200 OK', () => {
      const mockStore: StoreResponse = {
        id: 'store-1',
        name: 'My Store',
        slug: 'my-store',
        status: 'draft',
        logoUrl: null,
        description: null,
        heroHeadline: null,
        heroSubtitle: null,
      };

      storeApi.getMyStore().subscribe((res) => {
        expect(res).toEqual(mockStore);
      });

      const req = httpMock.expectOne(apiConfig.url('/stores/me'));
      expect(req.request.method).toBe('GET');
      req.flush(mockStore);
    });

    it('returns null when 409 Conflict occurs (domain not confirmed yet)', () => {
      storeApi.getMyStore().subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(apiConfig.url('/stores/me'));
      req.flush({ message: 'Domain not confirmed' }, { status: 409, statusText: 'Conflict' });
    });

    it('returns null on generic network/server error', () => {
      storeApi.getMyStore().subscribe((res) => {
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(apiConfig.url('/stores/me'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('ThemesApi', () => {
    it('fetches themes on 200 OK', () => {
      const mockThemesRes: GetThemesResponse = {
        themes: [
          {
            id: 't1',
            name: 'Theme 1',
            description: 'Desc',
            style: 'modern',
            font: 'Inter',
            radius: '0.5rem',
            light: { primary: '#000' },
            dark: { primary: '#fff' },
            isSelected: true,
            css: { basePreset: 'neutral', name: 'T1', description: 'D', rawCss: '' },
          },
        ],
      };

      themesApi.getThemes().subscribe((res) => {
        expect(res.themes.length).toBe(1);
        expect(res.themes[0].id).toBe('t1');
      });

      const req = httpMock.expectOne(apiConfig.url('/site-builder/themes'));
      expect(req.request.method).toBe('GET');
      req.flush(mockThemesRes);
    });

    it('returns empty themes array when 409 Conflict occurs', () => {
      themesApi.getThemes().subscribe((res) => {
        expect(res).toEqual({ themes: [] });
      });

      const req = httpMock.expectOne(apiConfig.url('/site-builder/themes'));
      req.flush({ message: 'Conflict' }, { status: 409, statusText: 'Conflict' });
    });

    it('generates themes via POST /site-builder/themes', () => {
      const mockThemesRes: GetThemesResponse = {
        themes: [
          {
            id: 't-new',
            name: 'New Theme',
            description: 'Generated',
            style: 'minimal',
            font: 'Inter',
            radius: '0.25rem',
            light: { primary: '#111' },
            dark: { primary: '#eee' },
            isSelected: false,
            css: { basePreset: 'neutral', name: 'NT', description: 'Desc', rawCss: '' },
          },
        ],
      };

      themesApi.generateThemes().subscribe((res) => {
        expect(res.themes.length).toBe(1);
        expect(res.themes[0].id).toBe('t-new');
      });

      const req = httpMock.expectOne(apiConfig.url('/site-builder/themes'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockThemesRes);
    });
  });

  describe('PublishApi', () => {
    it('posts publish payload and returns response', () => {
      const payload = { themeId: 'theme-luxury' };
      const mockResponse = { success: true, publishedUrl: 'https://store.invento.site' };

      publishApi.publishSite(payload).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.publishedUrl).toBe('https://store.invento.site');
      });

      const req = httpMock.expectOne(apiConfig.url('/site-builder/publish'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('DomainApi', () => {
    it('posts confirmDomain payload and returns response', () => {
      const payload = { businessName: 'Luxe Attire', domain: 'luxe-attire' };
      const mockResponse = { success: true, slug: 'luxe-attire' };

      domainApi.confirmDomain(payload).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.slug).toBe('luxe-attire');
      });

      const req = httpMock.expectOne(apiConfig.url('/site-builder/domain'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('BrainstormApi', () => {
    it('submits prompt with FormData and returns questions', () => {
      const prompt = 'A modern boutique selling organic soaps';
      const mockResponse = {
        questions: [{ questionId: 'q1', answer: 'Organic' }],
      };

      brainstormApi.analyzePrompt(prompt).subscribe((res) => {
        expect(res.questions.length).toBe(1);
        expect(res.questions[0].questionId).toBe('q1');
      });

      const req = httpMock.expectOne(apiConfig.url('/site-builder/brainstorm'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });

    it('attaches logo file to FormData when provided', () => {
      const prompt = 'A coffee shop';
      const dummyFile = new File(['dummy logo'], 'logo.png', { type: 'image/png' });

      brainstormApi.analyzePrompt(prompt, dummyFile).subscribe();

      const req = httpMock.expectOne(apiConfig.url('/site-builder/brainstorm'));
      expect(req.request.method).toBe('POST');
      const formData = req.request.body as FormData;
      expect(formData.get('brainstorm')).toBe(prompt);
      expect(formData.get('logo')).toBeDefined();
      req.flush({ questions: [] });
    });
  });

  describe('AiInterviewApi', () => {
    it('submits interview answers to backend', () => {
      const payload = {
        questions: [
          { questionId: 'q1', answer: 'Fashion' },
          { questionId: 'q2', answer: [1, 2] },
        ],
      };
      const mockResponse = { message: ['Success'], error: '', statusCode: 200 };

      aiInterviewApi.submitAnswers(payload).subscribe((res) => {
        expect(res.statusCode).toBe(200);
      });

      const req = httpMock.expectOne(apiConfig.url('/site-builder/answers'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('QuestionsApi', () => {
    it('fetches questions from backend', () => {
      const mockQuestions = [
        { id: 'q-custom', label: 'Custom Question', type: 'text' as const, required: true },
      ];

      questionsApi.getQuestions().subscribe((res) => {
        expect(res.questions).toEqual(mockQuestions);
      });

      const req = httpMock.expectOne(apiConfig.url('/site-builder/questions'));
      expect(req.request.method).toBe('GET');
      req.flush({ questions: mockQuestions });
    });

    it('falls back to bundled INTERVIEW_QUESTIONS on server error', () => {
      questionsApi.getQuestions().subscribe((res) => {
        expect(res.questions).toEqual(INTERVIEW_QUESTIONS);
      });

      const req = httpMock.expectOne(apiConfig.url('/site-builder/questions'));
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
