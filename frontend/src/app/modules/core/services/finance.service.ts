import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Observable } from 'rxjs';
import { EndPoints } from 'src/enums/endPoints.enum';
import { environment } from 'src/environments/environment.development';
import { MessageResponse } from '../models/response.model';
import {
  AddTransaction,
  AllTransactionsResponse,
  DetailsTransaction,
  UpdateTransactionPayload,
} from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class FinanceService {
  apiURL = `${environment.apiURL}/${EndPoints.finance}/${EndPoints.transaction}`;

  constructor(private http: HttpClient) {}

  getTransaction(id_transaction: string): Observable<DetailsTransaction> {
    return this.http.get<DetailsTransaction>(
      `${this.apiURL}/${id_transaction}`,
      {
        withCredentials: true,
      }
    );
  }

  getAllTransactions(
    pageIndex: number,
    itemsPerPage: number
  ): Observable<AllTransactionsResponse> {
    let params = new HttpParams()
      .append('page', pageIndex)
      .append('limit', itemsPerPage);

    return this.http.get<AllTransactionsResponse>(`${this.apiURL}/`, {
      withCredentials: true,
      params,
    });
  }

  addTransaction(transaction: AddTransaction): Observable<AddTransaction> {
    return this.http.post<AddTransaction>(this.apiURL, transaction, {
      withCredentials: true,
    });
  }

  updateTransaction(
    transaction: UpdateTransactionPayload
  ): Observable<UpdateTransactionPayload> {
    return this.http.patch<UpdateTransactionPayload>(this.apiURL, transaction, {
      withCredentials: true,
    });
  }

  deleteTransaction(id_transaction: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.apiURL}/${id_transaction}`,
      {
        withCredentials: true,
      }
    );
  }

  createDownloadLink(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    a.click();

    window.URL.revokeObjectURL(url);
  }

  downloadTransactionToJSON(transaction: DetailsTransaction): void {
    const jsonData = JSON.stringify(transaction, null, 2);

    const blob = new Blob([jsonData], { type: 'application/json' });

    this.createDownloadLink(
      blob,
      `transaction-${new Date(transaction.date).toLocaleDateString()}`
    );
  }

  downloadAllTransactionsToJSON(): void {
    this.getAllTransactions(1, 100).subscribe((data) => {
      const jsonData = JSON.stringify(data.transactions, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });

      this.createDownloadLink(blob, 'all-transactions');
    });
  }

  downloadTransactionToPDF(transaction: DetailsTransaction): void {
    const pdf = new jsPDF();
    pdf.text('Transaction Details', 10, 10);
    pdf.text(`ID: ${transaction._id}`, 10, 20);
    pdf.text(`Type: ${transaction.type}`, 10, 30);
    pdf.text(`Amount: ${transaction.amount} `, 10, 40);
    pdf.text(`Category: ${transaction.category}`, 10, 50);
    pdf.text(
      `Date: ${new Date(transaction.date).toLocaleDateString()}`,
      10,
      60
    );
    pdf.text(`Description: ${transaction.description}`, 10, 70);
    pdf.text(`Created at: ${transaction.createdAt}`, 10, 80);
    pdf.text(`Update at: ${transaction.updatedAt}`, 10, 90);

    pdf.save('transaction.pdf');
  }

  downloadAllTransactionToPDF() {
    this.getAllTransactions(1, 100).subscribe((data) => {
      const pdf = new jsPDF();
      data.transactions.forEach((transaction, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        pdf.text('Transaction number ' + index, 10, 10);
        pdf.text(`ID: ${transaction._id}`, 10, 20);
        pdf.text(`Type: ${transaction.type}`, 10, 30);
        pdf.text(`Amount: ${transaction.amount}`, 10, 40);
        pdf.text(`Category: ${transaction.category}`, 10, 50);
        pdf.text(
          `Date: ${new Date(transaction.date).toLocaleDateString()}`,
          10,
          60
        );
        pdf.text(`Description: ${transaction.description}`, 10, 70);
        pdf.text(`Created at: ${transaction.createdAt}`, 10, 80);
        pdf.text(`Update at: ${transaction.updatedAt}`, 10, 90);
      });
      pdf.save('all_transactions.pdf');
    });
  }
}
