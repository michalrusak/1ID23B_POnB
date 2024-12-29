import { createAction, props } from '@ngrx/store';
import {
  LoginData,
  ResponseUser,
  RegisterData,
  User,
} from '../../core/models/models';

export enum AuthActionType {
  LOGIN = '[Auth] Login',
  LOGIN_SUCCESS = '[Auth] Login Success',
  LOGIN_FAILURE = '[Auth] Login Failure',
  REGISTER = '[Auth] Register',
  REGISTER_SUCCESS = '[Auth] Register Success',
  REGISTER_FAILURE = '[Auth] Register Failure',
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

export const register = createAction(
  AuthActionType.REGISTER,
  props<{ registerData: RegisterData }>()
);

export const registerSuccess = createAction(
  AuthActionType.REGISTER_SUCCESS,
  props<{ message: string }>()
);

export const registerFailure = createAction(
  AuthActionType.REGISTER_FAILURE,
  props<{ error: string }>()
);

export const logout = createAction(AuthActionType.LOGOUT);
export const logoutSuccess = createAction(AuthActionType.LOGOUT_SUCCESS);
export const logoutFailure = createAction(AuthActionType.LOGOUT_FAILURE);

export const updateUser = createAction(
  AuthActionType.UPDATE_USER,
  props<{ user: User }>()
);
