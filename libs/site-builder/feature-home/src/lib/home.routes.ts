import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { Observable, of, catchError, map } from 'rxjs';
import { AuthService } from '@invento/shared-data-access-auth';
import { BuilderState } from '@invento/site-builder-data-access-builder';

export const homeResolver: ResolveFn<boolean> = (): Observable<boolean> => {
  const auth = inject(AuthService);
  const builderState = inject(BuilderState);
  if (!auth.isLoggedIn() || builderState.isHydrated()) {
    return of(true);
  }
  return builderState.hydrateFromBackend().pipe(
    map(() => true),
    catchError(() => of(true)),
  );
};

export const homeRoutes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    resolve: { storeStatus: homeResolver },
  },
  {
    path: 'style-test',
    loadComponent: () => import('./pages/style-test/style-test').then((m) => m.StyleTest),
  },
];
