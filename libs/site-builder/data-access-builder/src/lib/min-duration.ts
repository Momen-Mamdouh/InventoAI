import { Observable, timer, throwError } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

/**
 * Ensures an observable takes at least `minDurationMs` to emit or fail,
 * preventing micro-flashes when operations finish too quickly.
 */
export function withMinDuration<T>(source$: Observable<T>, minDurationMs = 900): Observable<T> {
  const startTime = Date.now();
  return source$.pipe(
    switchMap((res) => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDurationMs - elapsed);
      return timer(remaining).pipe(map(() => res));
    }),
    catchError((err) => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDurationMs - elapsed);
      return timer(remaining).pipe(switchMap(() => throwError(() => err)));
    }),
  );
}