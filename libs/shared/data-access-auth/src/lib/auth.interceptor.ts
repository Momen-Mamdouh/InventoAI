import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Attaches the bearer token to every request and transparently refreshes it on a 401, queuing
 * concurrent requests behind the in-flight refresh. Superset of the three apps' near-identical
 * interceptors (research.md R7: invento/userSite differ by 6 diff lines; site-builder's 83-line
 * variant is functionally identical). Resolves `AuthService` lazily through `Injector` (site-
 * builder's style) rather than `inject()` at closure scope, which is marginally safer against
 * circular DI and already proven across all three apps.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const injector = inject(Injector);

  const token = tokenService.getAccessToken();
  let authReq = req;

  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        const authService = injector.get(AuthService);

        // Don't intercept the refresh-token request itself to avoid infinite loops.
        if (req.url.includes('/users/refresh-token')) {
          authService.logout();
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          const refreshToken = tokenService.getRefreshToken();
          if (refreshToken) {
            return authService.refreshToken(refreshToken).pipe(
              switchMap((res) => {
                isRefreshing = false;
                refreshTokenSubject.next(res.accessToken);
                return next(
                  req.clone({
                    headers: req.headers.set('Authorization', `Bearer ${res.accessToken}`),
                  }),
                );
              }),
              catchError((err) => {
                isRefreshing = false;
                authService.logout();
                return throwError(() => err);
              }),
            );
          } else {
            isRefreshing = false;
            authService.logout();
            return throwError(() => error);
          }
        } else {
          return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((jwt) => {
              return next(
                req.clone({
                  headers: req.headers.set('Authorization', `Bearer ${jwt}`),
                }),
              );
            }),
          );
        }
      }
      return throwError(() => error);
    }),
  );
};
