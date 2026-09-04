import { Observable, of, throwError, lastValueFrom } from 'rxjs';
import { fallbackOnServerError, isServerProblem } from './api-fallback';

describe('isServerProblem', () => {
  it('treats a missing or zero status as a network failure', () => {
    expect(isServerProblem({})).toBe(true);
    expect(isServerProblem({ status: 0 })).toBe(true);
    expect(isServerProblem(null)).toBe(true);
  });

  it('treats 404 as an undeployed endpoint', () => {
    expect(isServerProblem({ status: 404 })).toBe(true);
  });

  it('treats 5xx as a server fault', () => {
    expect(isServerProblem({ status: 500 })).toBe(true);
    expect(isServerProblem({ status: 503 })).toBe(true);
  });

  it('does not mask client errors', () => {
    expect(isServerProblem({ status: 400 })).toBe(false);
    expect(isServerProblem({ status: 401 })).toBe(false);
    expect(isServerProblem({ status: 422 })).toBe(false);
  });
});

describe('fallbackOnServerError', () => {
  const fallbackValue = { ok: true, isFallback: true };
  const run = (source: Observable<unknown>) =>
    lastValueFrom(source.pipe(fallbackOnServerError(() => of(fallbackValue), 'test')));

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes successful values straight through', async () => {
    await expect(run(of({ ok: true }))).resolves.toEqual({ ok: true });
  });

  it('degrades to the fallback when the server is unreachable', async () => {
    await expect(run(throwError(() => ({ status: 0 })))).resolves.toEqual(fallbackValue);
  });

  it('degrades to the fallback on 404 and 5xx', async () => {
    await expect(run(throwError(() => ({ status: 404 })))).resolves.toEqual(fallbackValue);
    await expect(run(throwError(() => ({ status: 500 })))).resolves.toEqual(fallbackValue);
  });

  it('rethrows client errors so the user sees them', async () => {
    await expect(run(throwError(() => ({ status: 400 })))).rejects.toEqual({ status: 400 });
    await expect(run(throwError(() => ({ status: 401 })))).rejects.toEqual({ status: 401 });
  });
});
