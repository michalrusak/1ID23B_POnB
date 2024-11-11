import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EndPoints } from 'src/enums/endPoints.enum';
import { environment } from 'src/environments/environment.development';
import { LoginData, RegisterData, ResponseUser } from '../models/auth.model';
import { MessageResponse } from '../models/response.model';
import { AppState } from 'src/app/store/app.reducer';
import { Store } from '@ngrx/store';
import { selectIsUserLogged } from '../../auth/store/auth.selector';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  apiURL = `${environment.apiURL}/${EndPoints.auth}`;
  constructor(private http: HttpClient, private store: Store<AppState>) {}

  loggedUser$ = this.store.select(selectIsUserLogged);

  login(body: LoginData): Observable<ResponseUser> {
    return this.http.post<ResponseUser>(
      `${this.apiURL}/${EndPoints.login}`,
      body,
      {
        withCredentials: true,
      }
    );
  }

  logout(): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(
      `${this.apiURL}/${EndPoints.logout}`,
      {
        withCredentials: true,
      }
    );
  }

  register(body: RegisterData): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `${this.apiURL}/${EndPoints.register}`,
      body
    );
  }

  autoLogin(): Observable<ResponseUser> {
    return this.http.get<ResponseUser>(
      `${this.apiURL}/${EndPoints.autoLogin}`,
      {
        withCredentials: true,
      }
    );
  }
}
