export enum Finance {
  income = 'income',
  expense = 'expense',
}

export type Transaction = {
  _id: string;
  user_id: string;
  type: Finance.expense | Finance.income;
  amount: number;
  category: string;
  description: string;
  date: string;
};

export type AddTransaction = Omit<Transaction, '_id' | 'user_id'>;

export interface AllTransactionsResponse {
  transactions: DetailsTransaction[];
  count: number;
}

export interface UpdateTransactionPayload extends Partial<Transaction> {
  id: string;
}

export interface DetailsTransaction extends Transaction {
  createdAt: Date;
  updatedAt: Date;
}
