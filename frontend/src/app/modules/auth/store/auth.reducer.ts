import { Action, createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { User } from '../../core/models/models';

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
  on(AuthActions.loginSuccess, (state, action) => ({
    ...state,
    loading: false,
    user: action.user,
    error: null,
  })),
  on(AuthActions.loginFailure, (state, action) => ({
    ...state,
    loading: false,
    error: action.error,
  })),
  on(AuthActions.logout, AuthActions.logoutFailure, (state, action) => ({
    ...state,
  })),
  on(AuthActions.logoutSuccess, (state, action) => ({
    ...state,
    user: null,
    error: null,
  }))
);

export function authReducer(state: AuthState | undefined, action: Action) {
  return _authReducer(state, action);
}
