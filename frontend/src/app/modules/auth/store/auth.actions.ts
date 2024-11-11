import { createAction, props } from '@ngrx/store';
import { LoginData, ResponseUser } from '../../core/models/auth.model';
import { User } from '../../core/models/user.model';

enum AuthActionType {
  LOGIN = '[Auth] Login',
  LOGIN_SUCCESS = '[Auth] Login Success',
  LOGIN_FAILURE = '[Auth] Login Failure',
  AUTOLOGIN = '[Auth] Auto Login',
  AUTOLOGIN_SUCCESS = '[Auth] Auto Login Success',
  AUTOLOGIN_FAILURE = '[Auth] Auto Login Failure',
  LOGOUT = '[Auth] Logout',
  LOGOUT_SUCCESS = '[Auth] Logout Success',
  LOGOUT_FAILURE = '[Auth] Logout Failure',
  UPDATE_USER = '[Auth] Update User',
}

export const login = createAction(
  AuthActionType.LOGIN,
  props<{ loginData: LoginData }>()
);

export const loginSuccess = createAction(
  AuthActionType.LOGIN_SUCCESS,
  props<{ user: ResponseUser }>()
);

export const loginFailure = createAction(
  AuthActionType.LOGIN_FAILURE,
  props<{ error: string }>()
);

export const autoLogin = createAction(AuthActionType.AUTOLOGIN);

export const autoLoginSuccess = createAction(
  AuthActionType.AUTOLOGIN_SUCCESS,
  props<{ user: ResponseUser }>()
);

export const autoLoginFailure = createAction(AuthActionType.AUTOLOGIN_FAILURE);

export const logout = createAction(AuthActionType.LOGOUT);

export const logoutSuccess = createAction(AuthActionType.LOGOUT_SUCCESS);

export const logoutFailure = createAction(AuthActionType.LOGOUT_FAILURE);

export const UpdateUser = createAction(
  AuthActionType.UPDATE_USER,
  props<{ user: User }>()
);
