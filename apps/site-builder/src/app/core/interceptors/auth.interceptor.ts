import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { TokenService } from '../service/token.service';
import { AuthService } from '../service/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const injector = inject(Injector);

  // Add auth header if token exists
  const token = tokenService.getAccessToken();
  let authReq = req;

  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If error is 401 (Unauthorized) and we are not already trying to refresh token
      if (error.status === 401 && token) {
        const authService = injector.get(AuthService);

        // Don't intercept the refresh token request itself to avoid infinite loops
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
                // Retry the original request with the new token
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
          // Wait while token is refreshing, then retry
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
