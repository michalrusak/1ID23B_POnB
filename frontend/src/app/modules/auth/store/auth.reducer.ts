import { Action, createReducer, on } from '@ngrx/store';
import { User } from '../../core/models/user.model';
import * as AuthActions from './auth.actions';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

const _authReducer = createReducer(
  initialState,
  on(AuthActions.login, (state, action) => ({
    ...state,
    loading: true,
  })),
  on(
    AuthActions.loginSuccess,
    AuthActions.autoLoginSuccess,
    (state, action) => ({
      ...state,
      loading: false,
      user: action.user.user,
      error: null,
    })
  ),
  on(AuthActions.loginFailure, (state, action) => ({
    ...state,
    loading: false,
    error: action.error,
  })),
  on(
    AuthActions.autoLogin,
    AuthActions.autoLoginFailure,
    AuthActions.logout,
    AuthActions.logoutFailure,
    (state, action) => ({
      ...state,
    })
  ),
  on(AuthActions.logoutSuccess, (state, action) => ({
    ...state,
    user: null,
    error: null,
  })),
  on(AuthActions.UpdateUser, (state, action) => ({
    ...state,
    user: action.user,
  }))
);

export function authReducer(state: AuthState | undefined, action: Action) {
  return _authReducer(state, action);
}
