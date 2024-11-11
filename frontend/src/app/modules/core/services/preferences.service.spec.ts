import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EndPoints } from 'src/enums/endPoints.enum';
import { environment } from 'src/environments/environment.development';
import { mockCategories, mockUserPreferences } from 'src/mock-data/mock-data';
import { PreferencesService } from './preferences.service';

describe('PreferencesService', () => {
  let service: PreferencesService;
  let testingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PreferencesService],
    });
    service = TestBed.inject(PreferencesService);
    testingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch default income categories', (done) => {
    service.getDefaultIncomeCategories().subscribe((categories) => {
      expect(categories).toEqual(mockCategories);
      done();
    });

    const req = testingController.expectOne(
      `${environment.apiURL}/${EndPoints.finance}/${EndPoints.getDefaultIncomeCategories}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockCategories);
    testingController.verify();
  });

  it('should fetch default expense categories', (done) => {
    service.getDefaultExpenseCategories().subscribe((categories) => {
      expect(categories).toEqual(mockCategories);
      done();
    });

    const req = testingController.expectOne(
      `${environment.apiURL}/${EndPoints.finance}/${EndPoints.getDefaultExpenseCategories}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockCategories);
    testingController.verify();
  });

  it('should fetch default currencies', (done) => {
    service.getDefaultCurrencies().subscribe((currencies) => {
      expect(currencies).toEqual(mockCategories);
      done();
    });

    const req = testingController.expectOne(
      `${environment.apiURL}/${EndPoints.finance}/${EndPoints.getDefaultCurrency}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockCategories);
    testingController.verify();
  });

  it('should fetch user preferences', (done) => {
    service.getUserPreferences().subscribe((userPreferences) => {
      expect(userPreferences).toEqual(mockUserPreferences);
      done();
    });

    const req = testingController.expectOne(
      `${environment.apiURL}/${EndPoints.finance}/${EndPoints.userPreferences}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockUserPreferences);
    testingController.verify();
  });

  it('should add user preferences', (done) => {
    service
      .addUserPreferences(mockUserPreferences)
      .subscribe((userPreferences) => {
        expect(userPreferences).toEqual(mockUserPreferences);
        done();
      });

    const req = testingController.expectOne(
      `${environment.apiURL}/${EndPoints.finance}/${EndPoints.userPreferences}`
    );
    expect(req.request.method).toBe('POST');
    req.flush(mockUserPreferences);
    testingController.verify();
  });

  it('should update user preferences', (done) => {
    service
      .updateUserPreferences(mockUserPreferences)
      .subscribe((userPreferences) => {
        expect(userPreferences).toEqual(mockUserPreferences);
        done();
      });

    const req = testingController.expectOne(
      `${environment.apiURL}/${EndPoints.finance}/${EndPoints.userPreferences}`
    );
    expect(req.request.method).toBe('PATCH');
    req.flush(mockUserPreferences);
    testingController.verify();
  });
});
