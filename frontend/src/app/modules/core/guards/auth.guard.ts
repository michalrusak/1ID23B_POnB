import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { switchMap, map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RouterEnum } from 'src/enums/router.enum';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.autoLogin().pipe(
    switchMap(() => authService.loggedUser$),
    map((isLoggedIn) => {
      if (isLoggedIn) {
        return true;
      } else {
        router.navigate([RouterEnum.home]);
        return false;
      }
    }),
    catchError(() => {
      router.navigate([RouterEnum.home]);
      return of(false);
    })
  );
};
