import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { SettingsService } from './settings.service';
import { environment } from 'src/environments/environment';
import { EndPoints } from 'src/enums/endPoints.enum';
import {
  changePasswordPayload,
  changePasswordtMessageResponse,
  deleteAccountMessageResponse,
  updateUser,
  updateUserMessageResponse,
  mockUser,
} from 'src/mock-data/mock-data';

describe('SettingsService', () => {
  let service: SettingsService;
  let testingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingsService],
    });
    service = TestBed.inject(SettingsService);
    testingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch user info', (done) => {
    service.getUserInfo().subscribe((response) => {
      expect(response).toBeTruthy();
      done();
    });

    const req = testingController.expectOne(
      `${environment.apiURL}/${EndPoints.user}`
    );

    req.flush(mockUser);
    expect(req.request.method).toBe('GET');
    testingController.verify();
  });

  it('should update user', (done) => {
    service.updateUser(updateUser).subscribe((response) => {
      expect(response).toBeTruthy();
      done();
    });

    const req = testingController.expectOne(
      `${environment.apiURL}/${EndPoints.user}`
    );

    req.flush(updateUserMessageResponse);
    expect(req.request.method).toBe('PATCH');
    testingController.verify();
  });

  it('should change password', (done) => {
    service.changePassword(changePasswordPayload).subscribe((response) => {
      expect(response).toBeTruthy();
      done();
    });

    const req = testingController.expectOne(
      `${environment.apiURL}/${EndPoints.user}`
    );

    req.flush(changePasswordtMessageResponse);
    expect(req.request.method).toBe('POST');
    testingController.verify();
  });

  it('should delete account', (done) => {
    service.deleteAccount().subscribe((response) => {
      expect(response).toBeTruthy();
      done();
    });

    const req = testingController.expectOne(
      `${environment.apiURL}/${EndPoints.user}`
    );

    req.flush(deleteAccountMessageResponse);
    expect(req.request.method).toBe('DELETE');
    testingController.verify();
  });
});
