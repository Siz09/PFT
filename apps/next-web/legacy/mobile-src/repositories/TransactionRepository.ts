import { databaseManager } from '../db/DatabaseManager';
import type {
  CreateTransactionInput,
  TransactionQueryFilters,
  TransactionRecord,
  UpdateTransactionInput,
} from '../types/finance';

const safeParseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const mapRecord = (row: any): TransactionRecord => ({
  id: row.id,
  amountCents: row.amount,
  type: row.type,
  categoryId: row.category_id,
  categoryName: row.category_name ?? null,
  merchant: row.merchant,
  description: row.description,
  date: row.date,
  receiptPath: row.receipt_path,
  ocrConfidence: row.ocr_confidence,
  isRecurring: Boolean(row.is_recurring),
  recurringId: row.recurring_id,
  tags: safeParseJson<string[]>(row.tags, []),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

type CreatePayload = CreateTransactionInput & { id: string; createdAt: string; updatedAt: string };

export class TransactionRepository {
  async create(payload: CreatePayload) {
    const db = await databaseManager.getDatabase();
    await db.runAsync(
      `INSERT INTO transactions (
        id, amount, type, category_id, merchant, description, date, receipt_path,
        ocr_confidence, is_recurring, recurring_id, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      payload.id,
      payload.amountCents,
      payload.type,
      payload.categoryId,
      payload.merchant ?? null,
      payload.description ?? null,
      payload.date,
      payload.receiptPath ?? null,
      payload.ocrConfidence ?? null,
      0,
      null,
      JSON.stringify(payload.tags ?? []),
      payload.createdAt,
      payload.updatedAt
    );

    return this.getById(payload.id);
  }

  async update(id: string, input: UpdateTransactionInput & { updatedAt: string }) {
    const db = await databaseManager.getDatabase();
    const current = await this.getById(id);
    if (!current) {
      return null;
    }

    const merged = {
      amountCents: input.amountCents === undefined ? current.amountCents : input.amountCents,
      type: input.type === undefined ? current.type : input.type,
      categoryId: input.categoryId === undefined ? current.categoryId : input.categoryId,
      merchant: input.merchant === undefined ? current.merchant : input.merchant,
      description: input.description === undefined ? current.description : input.description,
      date: input.date === undefined ? current.date : input.date,
      tags: input.tags === undefined ? current.tags : input.tags,
      updatedAt: input.updatedAt,
    };

    await db.runAsync(
      `UPDATE transactions
       SET amount = ?, type = ?, category_id = ?, merchant = ?, description = ?, date = ?, tags = ?, updated_at = ?
       WHERE id = ?;`,
      merged.amountCents,
      merged.type,
      merged.categoryId,
      merged.merchant,
      merged.description,
      merged.date,
      JSON.stringify(merged.tags),
      merged.updatedAt,
      id
    );

    return this.getById(id);
  }

  async delete(id: string) {
    const db = await databaseManager.getDatabase();
    await db.runAsync('DELETE FROM transactions WHERE id = ?;', id);
  }

  async getById(id: string) {
    const db = await databaseManager.getDatabase();
    const row = await db.getFirstAsync<any>('SELECT * FROM transactions WHERE id = ?;', id);
    return row ? mapRecord(row) : null;
  }

  async query(filters: TransactionQueryFilters = {}) {
    const db = await databaseManager.getDatabase();
    const clauses: string[] = [];
    const params: Array<string | number> = [];

    if (filters.search) {
      const escapedSearch = filters.search.replace(/([%_\\])/g, '\\$1');
      clauses.push("(merchant LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')");
      params.push(`%${escapedSearch}%`, `%${escapedSearch}%`);
    }

    if (filters.type) {
      clauses.push('type = ?');
      params.push(filters.type);
    }

    if (filters.categoryId) {
      clauses.push('category_id = ?');
      params.push(filters.categoryId);
    }

    if (filters.fromDate) {
      clauses.push('date >= ?');
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      clauses.push('date <= ?');
      params.push(filters.toDate);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = Math.min(filters.limit ?? 50, 50);
    const offset = filters.offset ?? 0;

    const rows = await db.getAllAsync<any>(
      `SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?;`,
      ...params,
      limit,
      offset
    );

    return rows.map(mapRecord);
  }
}
