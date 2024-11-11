import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  deleteTransactionMessageResponse,
  errorMessageNotFound,
  mockAddTransaction,
  mockAllTransactions,
  mockTransaction,
  mockUpdateTransaction,
} from 'src/mock-data/mock-data';
import { FinanceService } from './finance.service';

describe('FinanceService', () => {
  let service: FinanceService;
  let testingController: HttpTestingController;
  let createObjectURLSpy: jasmine.Spy;
  let revokeObjectURLSpy: jasmine.Spy;
  let clickSpy: jasmine.Spy;
  let aElement: HTMLAnchorElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FinanceService],
    });
    service = TestBed.inject(FinanceService);
    testingController = TestBed.inject(HttpTestingController);

    createObjectURLSpy = spyOn(window.URL, 'createObjectURL').and.returnValue(
      'blob:url'
    );
    revokeObjectURLSpy = spyOn(window.URL, 'revokeObjectURL');

    aElement = document.createElement('a');
    clickSpy = spyOn(aElement, 'click');

    spyOn(document, 'createElement').and.returnValue(aElement);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch a transaction by ID', () => {
    const id = '123';
    service.getTransaction(id).subscribe((transaction) => {
      expect(transaction).toEqual(mockTransaction);
    });

    const req = testingController.expectOne(`${service.apiURL}/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTransaction);
  });

  it('should handle error when fetching a transaction', () => {
    const id = '123';
    service.getTransaction(id).subscribe(
      () => fail('expected an error, not a transaction'),
      (error) => expect(error.message).toContain(errorMessageNotFound)
    );

    const req = testingController.expectOne(`${service.apiURL}/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush(errorMessageNotFound, { status: 404, statusText: 'Not Found' });
  });

  it('should fetch all transactions', () => {
    service.getAllTransactions(0, 5).subscribe((transactions) => {
      expect(transactions).toEqual(mockAllTransactions);
    });

    const req = testingController.expectOne(
      `${service.apiURL}/?page=0&limit=5`
    );

    expect(req.request.method).toBe('GET');
    req.flush(mockAllTransactions);
  });

  it('should add transaction', () => {
    service.addTransaction(mockAddTransaction).subscribe((transactions) => {
      expect(transactions).toEqual(mockAddTransaction);
    });

    const req = testingController.expectOne(service.apiURL);

    expect(req.request.method).toBe('POST');
    req.flush(mockAddTransaction);
  });

  it('should update transaction', () => {
    service
      .updateTransaction(mockUpdateTransaction)
      .subscribe((transactions) => {
        expect(transactions).toEqual(mockUpdateTransaction);
      });

    const req = testingController.expectOne(service.apiURL);

    expect(req.request.method).toBe('PATCH');
    req.flush(mockUpdateTransaction);
  });

  it('should delete transaction', () => {
    const id = '123';
    service.deleteTransaction(id).subscribe((transactions) => {
      expect(transactions).toEqual(deleteTransactionMessageResponse);
    });

    const req = testingController.expectOne(`${service.apiURL}/${id}`);

    expect(req.request.method).toBe('DELETE');
    req.flush(deleteTransactionMessageResponse);
  });

  it('should create a download link and trigger a download', () => {
    const blob = new Blob([JSON.stringify({ key: 'value' })], {
      type: 'application/json',
    });
    const fileName = 'testFile';

    service.createDownloadLink(blob, fileName);

    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(aElement.href).toBe('blob:url');
    expect(aElement.download).toBe(`${fileName}.json`);

    expect(clickSpy).toHaveBeenCalled();

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:url');
  });
});
