import { MonoTypeOperatorFunction, Observable, catchError } from 'rxjs';

/**
 * True when a failure is the server's fault rather than the caller's:
 * network down (status 0/absent), endpoint not deployed yet (404), or 5xx.
 *
 * 4xx responses other than 404 (400 Bad Request, 401 Unauthorized,
 * 422 Unprocessable) mean our payload was wrong, so they must surface to the
 * user rather than being masked by a fallback.
 */
export function isServerProblem(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status;
  if (typeof status !== 'number' || status === 0) return true;
  if (status === 404) return true;
  return status >= 500;
}

/**
 * Degrades to `fallback` when the server is unreachable or broken, and
 * rethrows genuine client errors.
 *
 * This is the single fallback policy for every API service. Previously each
 * service inlined its own `catchError`, and the three variants disagreed about
 * which statuses were recoverable.
 */
export function fallbackOnServerError<T>(
  // NoInfer keeps T pinned to the source observable, so a narrower fallback
  // literal (e.g. { isFallback: true }) does not shrink the stream's type.
  fallback: () => Observable<NoInfer<T>>,
  context: string,
): MonoTypeOperatorFunction<T> {
  return catchError<T, Observable<T>>((err) => {
    if (!isServerProblem(err)) throw err;
    console.warn(`${context}: server unavailable, using fallback.`, err);
    return fallback();
  });
}
