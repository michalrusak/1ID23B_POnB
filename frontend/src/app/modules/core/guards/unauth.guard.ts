import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { switchMap, map, catchError, of } from 'rxjs';
import { RouterEnum } from 'src/enums/router.enum';
import { AuthService } from '../services/auth.service';

export const unAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.autoLogin().pipe(
    switchMap(() => authService.loggedUser$),
    map((isLoggedIn) => {
      if (isLoggedIn) {
        router.navigate([RouterEnum.home]);
        return false;
      } else {
        return true;
      }
    }),
    catchError(() => {
      return of(true);
    })
  );
};
