import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EndPoints } from 'src/enums/endPoints.enum';
import { environment } from 'src/environments/environment.development';
import { Categories, UserPreferences } from '../models/preferences.model';

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  apiURL = `${environment.apiURL}/${EndPoints.finance}`;
  constructor(private http: HttpClient) {}

  getDefaultCurrencies(): Observable<Categories> {
    return this.http.get<Categories>(
      `${this.apiURL}/${EndPoints.getDefaultCurrency}`,
      {
        withCredentials: true,
      }
    );
  }

  getDefaultIncomeCategories(): Observable<Categories> {
    return this.http.get<Categories>(
      `${this.apiURL}/${EndPoints.getDefaultIncomeCategories}`,
      {
        withCredentials: true,
      }
    );
  }

  getDefaultExpenseCategories(): Observable<Categories> {
    return this.http.get<Categories>(
      `${this.apiURL}/${EndPoints.getDefaultExpenseCategories}`,
      {
        withCredentials: true,
      }
    );
  }

  addUserPreferences(body: UserPreferences): Observable<UserPreferences> {
    return this.http.post<UserPreferences>(
      `${this.apiURL}/${EndPoints.userPreferences}`,
      body,
      {
        withCredentials: true,
      }
    );
  }

  updateUserPreferences(body: UserPreferences): Observable<UserPreferences> {
    return this.http.patch<UserPreferences>(
      `${this.apiURL}/${EndPoints.userPreferences}`,
      body,
      {
        withCredentials: true,
      }
    );
  }

  getUserPreferences(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(
      `${this.apiURL}/${EndPoints.userPreferences}`,
      {
        withCredentials: true,
      }
    );
  }
}
