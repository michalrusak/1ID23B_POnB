import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthService } from '../../core/services/auth.service';
import * as AuthActions from './auth.actions';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { RouterEnum } from 'src/enums/router.enum';
import { NotifierService } from 'angular-notifier';

@Injectable()
export class AuthEffects {
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap((action) =>
        this.authService.login(action.loginData.username, action.loginData.password).pipe(
          map((user) => {
            this.router.navigate([RouterEnum.home]);
            this.notifierService.notify('success', 'Login successful');
            return AuthActions.loginSuccess({ user });
          }),
          catchError((error) => {
            this.notifierService.notify('error', 'Login failed');
            return of(AuthActions.loginFailure({ error: error.message }));
          })
        )
      )
    )
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap((action) =>
        this.authService.register(action.registerData.username, action.registerData.password).pipe(
          map((response) => {
            this.router.navigate([RouterEnum.login]);
            this.notifierService.notify('success', 'Registration successful');
            return AuthActions.registerSuccess({ message: response.username });
          }),
          catchError((error) => {
            this.notifierService.notify('error', 'Registration failed');
            return of(AuthActions.registerFailure({ error: error.message }));
          })
        )
      )
    )
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() =>
        this.authService.logout().pipe(
          map(() => {
            this.router.navigate([RouterEnum.login]);
            this.notifierService.notify('success', 'Logout successful');
            return AuthActions.logoutSuccess();
          }),
          catchError(() => {
            this.notifierService.notify('error', 'Logout failed');
            return of(AuthActions.logoutFailure());
          })
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private router: Router,
    private notifierService: NotifierService
  ) {}
}