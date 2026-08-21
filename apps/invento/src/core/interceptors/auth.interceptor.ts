import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { TokenService } from '../service/token.service';
import { AuthService } from '../service/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

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
