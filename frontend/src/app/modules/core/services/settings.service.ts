import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EndPoints } from 'src/enums/endPoints.enum';
import { environment } from 'src/environments/environment.development';
import {
  UpdateUserPayload,
  ChangePasswordPayload,
  User,
} from '../models/user.model';
import { MessageResponse } from '../models/response.model';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  apiURL = `${environment.apiURL}/${EndPoints.user}`;
  constructor(private http: HttpClient) {}

  getUserInfo(): Observable<User> {
    return this.http.get<User>(this.apiURL, {
      withCredentials: true,
    });
  }

  updateUser(body: UpdateUserPayload): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(this.apiURL, body, {
      withCredentials: true,
    });
  }

  changePassword(body: ChangePasswordPayload): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.apiURL, body, {
      withCredentials: true,
    });
  }

  deleteAccount(): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(this.apiURL, {
      withCredentials: true,
    });
  }
}
