import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { AUTH_CONFIG, AuthConfig } from './auth-config';
import { AuthResponse } from './auth.interface';

/**
 * Moved unchanged from `apps/site-builder/src/app/core/service/auth.service.spec.ts` (T060,
 * FR-035) — imports retargeted to the shared library's sibling files, and the `BuilderState`
 * mock/provider dropped: the superset `AuthService` never depends on `BuilderState` (a
 * site-builder-only concept — see `auth-superset.md`'s "Deferred to Phase 9 / Phase 10" section),
 * so there is nothing left for that provider to stand in for. `AUTH_CONFIG` is supplied in its
 * place, matching site-builder's original "owner" auth role, since that is what this spec
 * exercises (`googleLoginOwner` against `/users/google/owner`). `provideRouter([])` is added
 * because the superset service also injects `Router` (for the universal post-logout redirect,
 * §auth-superset.md capability matrix) — the original 107-line site-builder service did not.
 */
describe('AuthService - Google Owner Sign-In', () => {
  let authService: AuthService;
  let tokenService: TokenService;
  let httpMock: HttpTestingController;

  const testAuthConfig: AuthConfig = {
    apiBaseUrl: '',
    postLoginRoute: '/home',
    tokenStorageKey: 'invento',
    googleClientId: '',
    verifyEmailRedirect: '/auth/login',
    authBasePath: '/auth',
    authRole: 'owner',
  };

  const mockGoogleOwnerResponse: AuthResponse = {
    accessToken: 'mock-access-token-xyz',
    refreshToken: 'mock-refresh-token-xyz',
    user: {
      id: 'c4a9120f-2b11-44a3-8f7d-e73a210c4d90',
      firstName: 'Layla',
      lastName: 'Hassan',
      image: 'https://lh3.googleusercontent.com/a/ACg8ocL-photo=s96-c',
      email: 'layla.hassan@gmail.com',
      role: 'OWNER',
      storeId: null,
      isEmailVerified: true,
      createdAt: '2026-08-17T09:20:44.907Z',
      updatedAt: '2026-08-17T09:20:44.907Z',
    },
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        TokenService,
        { provide: AUTH_CONFIG, useValue: testAuthConfig },
        provideRouter([]),
      ],
    });

    authService = TestBed.inject(AuthService);
    tokenService = TestBed.inject(TokenService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should post idToken to /users/google/owner and store tokens on success', () => {
    const idToken = 'mock-google-id-token';

    authService.googleLoginOwner(idToken).subscribe((response) => {
      expect(response).toEqual(mockGoogleOwnerResponse);
      expect(tokenService.getAccessToken()).toBe('mock-access-token-xyz');
      expect(tokenService.getRefreshToken()).toBe('mock-refresh-token-xyz');
      expect(authService.currentUser()).toEqual(mockGoogleOwnerResponse.user);
      expect(authService.currentUser()?.role).toBe('OWNER');
      expect(authService.currentUser()?.storeId).toBeNull();
    });

    const req = httpMock.expectOne('/users/google/owner');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ idToken });
    expect(req.request.body.storeSlug).toBeUndefined();

    req.flush(mockGoogleOwnerResponse);
  });

  it('should propagate 400 Bad Request error if token is invalid or storeSlug is sent', () => {
    const idToken = 'invalid-token';

    authService.googleLoginOwner(idToken).subscribe({
      next: () => {
        throw new Error('Should have failed');
      },
      error: (err) => {
        expect(err.status).toBe(400);
        expect(err.error.message).toContain('property storeSlug should not exist');
      },
    });

    const req = httpMock.expectOne('/users/google/owner');
    req.flush(
      {
        statusCode: 400,
        error: 'Bad Request',
        message: ['property storeSlug should not exist'],
      },
      { status: 400, statusText: 'Bad Request' },
    );
  });

  it('should propagate 401 Unauthorized error when token is expired or unauthorized', () => {
    const idToken = 'expired-token';

    authService.googleLoginOwner(idToken).subscribe({
      next: () => {
        throw new Error('Should have failed');
      },
      error: (err) => {
        expect(err.status).toBe(401);
        expect(err.error.message).toBe('Google sign-in failed');
      },
    });

    const req = httpMock.expectOne('/users/google/owner');
    req.flush(
      {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Google sign-in failed',
      },
      { status: 401, statusText: 'Unauthorized' },
    );
  });

  it('should propagate 403 Forbidden error when email is not verified', () => {
    const idToken = 'unverified-email-token';

    authService.googleLoginOwner(idToken).subscribe({
      next: () => {
        throw new Error('Should have failed');
      },
      error: (err) => {
        expect(err.status).toBe(403);
        expect(err.error.message).toBe("Your Google account's email is not verified");
      },
    });

    const req = httpMock.expectOne('/users/google/owner');
    req.flush(
      {
        statusCode: 403,
        error: 'Forbidden',
        message: "Your Google account's email is not verified",
      },
      { status: 403, statusText: 'Forbidden' },
    );
  });

  it('should propagate 503 Service Unavailable when Google verification cannot be reached', () => {
    const idToken = 'valid-token-but-service-down';

    authService.googleLoginOwner(idToken).subscribe({
      next: () => {
        throw new Error('Should have failed');
      },
      error: (err) => {
        expect(err.status).toBe(503);
        expect(err.error.message).toContain('Google sign-in is temporarily unavailable');
      },
    });

    const req = httpMock.expectOne('/users/google/owner');
    req.flush(
      {
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'Google sign-in is temporarily unavailable, please try again later',
      },
      { status: 503, statusText: 'Service Unavailable' },
    );
  });
});
