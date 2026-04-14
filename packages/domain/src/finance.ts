export type TransactionType = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
};

export type TransactionRecord = {
  id: string;
  amountCents: number;
  type: TransactionType;
  categoryId: string;
  categoryName?: string;
  merchant: string | null;
  description: string | null;
  date: string;
  receiptPath: string | null;
  ocrConfidence: number | null;
  isRecurring: boolean;
  recurringId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTransactionInput = {
  amountCents: number;
  type: TransactionType;
  categoryId: string;
  merchant?: string | null;
  description?: string | null;
  date: string;
  tags?: string[];
  receiptPath?: string | null;
  ocrConfidence?: number | null;
};

export type UpdateTransactionInput = Partial<Omit<CreateTransactionInput, "type">> & {
  type?: TransactionType;
};

export type TransactionQueryFilters = {
  search?: string;
  type?: TransactionType;
  categoryId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
};
