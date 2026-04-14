import type {
  CreateTransactionInput,
  TransactionQueryFilters,
  TransactionRecord,
  UpdateTransactionInput,
} from '../types/finance';

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const isIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(year, month - 1, day);

  return parsed.getFullYear() === year && parsed.getMonth() + 1 === month && parsed.getDate() === day;
};

const isIsoDateFormat = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const validateId = (id: string) => {
  if (!id.trim()) {
    throw new Error('Transaction id is required');
  }
};

export class TransactionService {
  constructor(private readonly repository: TransactionRepositoryPort) {}

  async create(input: CreateTransactionInput) {
    this.validateCreate(input);

    const now = new Date().toISOString();
    return this.repository.create({
      ...input,
      id: createId(),
      createdAt: now,
      updatedAt: now,
    });
  }

  async update(id: string, input: UpdateTransactionInput) {
    validateId(id);
    this.validateUpdate(input);
    return this.repository.update(id, {
      ...input,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: string) {
    validateId(id);
    await this.repository.delete(id);
  }

  async query(filters: TransactionQueryFilters = {}) {
    return this.repository.query(filters);
  }

  private validateCreate(input: CreateTransactionInput) {
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    if (!input.categoryId?.trim()) {
      throw new Error('Category is required');
    }
    if (!isIsoDateFormat(input.date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }
    if (!isIsoDate(input.date)) {
      throw new Error('Invalid calendar date');
    }
  }

  private validateUpdate(input: UpdateTransactionInput) {
    if (input.amountCents !== undefined && (!Number.isInteger(input.amountCents) || input.amountCents <= 0)) {
      throw new Error('Amount must be greater than 0');
    }
    if (input.categoryId !== undefined && !input.categoryId.trim()) {
      throw new Error('Category is required');
    }
    if (input.date !== undefined && !isIsoDateFormat(input.date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }
    if (input.date !== undefined && !isIsoDate(input.date)) {
      throw new Error('Invalid calendar date');
    }
  }
}

export type TransactionRepositoryPort = {
  create: (payload: CreateTransactionInput & { id: string; createdAt: string; updatedAt: string }) => Promise<TransactionRecord | null>;
  update: (id: string, input: UpdateTransactionInput & { updatedAt: string }) => Promise<TransactionRecord | null>;
  delete: (id: string) => Promise<void>;
  query: (filters?: TransactionQueryFilters) => Promise<TransactionRecord[]>;
};
