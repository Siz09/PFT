import type {
  CreateTransactionInput,
  TransactionQueryFilters,
  TransactionRecord,
  UpdateTransactionInput,
  TransactionRepositoryPort,
} from "@smartspend/domain";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

type TransactionRow = {
  id: string;
  amount_cents: number;
  type: "income" | "expense";
  category_id: string;
  merchant: string | null;
  description: string | null;
  transaction_date: string;
  receipt_path: string | null;
  ocr_confidence: number | null;
  tags: unknown;
  created_at: string;
  updated_at: string;
  categories?: { name: string } | null;
};

const escapeSearchForIlike = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/([%_])/g, "\\$1")
    .replace(/[,.]/g, " ");

const toRecord = (row: TransactionRow): TransactionRecord => ({
  id: row.id,
  amountCents: row.amount_cents,
  type: row.type,
  categoryId: row.category_id,
  categoryName: row.categories?.name ?? undefined,
  merchant: row.merchant,
  description: row.description,
  date: row.transaction_date,
  receiptPath: row.receipt_path,
  ocrConfidence: row.ocr_confidence,
  isRecurring: false,
  recurringId: null,
  tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class SupabaseTransactionRepository implements TransactionRepositoryPort {
  async create(payload: CreateTransactionInput & { id: string; createdAt: string; updatedAt: string }) {
    const client = createSupabaseServiceRoleClient();
    const { data, error } = await client
      .from("transactions")
      .insert({
        id: payload.id,
        amount_cents: payload.amountCents,
        type: payload.type,
        category_id: payload.categoryId,
        merchant: payload.merchant ?? null,
        description: payload.description ?? null,
        transaction_date: payload.date,
        receipt_path: payload.receiptPath ?? null,
        ocr_confidence: payload.ocrConfidence ?? null,
        tags: payload.tags ?? [],
        created_at: payload.createdAt,
        updated_at: payload.updatedAt,
      })
      .select("*, categories(name)")
      .single<TransactionRow>();

    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
    return data ? toRecord(data) : null;
  }

  async update(id: string, input: UpdateTransactionInput & { updatedAt: string }) {
    const client = createSupabaseServiceRoleClient();

    const patch: Record<string, unknown> = {
      updated_at: input.updatedAt,
    };
    if (input.amountCents !== undefined) patch.amount_cents = input.amountCents;
    if (input.type !== undefined) patch.type = input.type;
    if (input.categoryId !== undefined) patch.category_id = input.categoryId;
    if (input.merchant !== undefined) patch.merchant = input.merchant;
    if (input.description !== undefined) patch.description = input.description;
    if (input.date !== undefined) patch.transaction_date = input.date;
    if (input.tags !== undefined) patch.tags = input.tags;
    if (input.receiptPath !== undefined) patch.receipt_path = input.receiptPath;
    if (input.ocrConfidence !== undefined) patch.ocr_confidence = input.ocrConfidence;

    const { data, error } = await client
      .from("transactions")
      .update(patch)
      .eq("id", id)
      .select("*, categories(name)")
      .single<TransactionRow>();

    if (error) {
      throw new Error(`Failed to update transaction: ${error.message}`);
    }
    return data ? toRecord(data) : null;
  }

  async delete(id: string) {
    const client = createSupabaseServiceRoleClient();
    const { error } = await client.from("transactions").delete().eq("id", id);
    if (error) {
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }
  }

  async query(filters: TransactionQueryFilters = {}) {
    const client = createSupabaseServiceRoleClient();
    let query = client
      .from("transactions")
      .select("*, categories(name)")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.search) {
      const safeSearch = escapeSearchForIlike(filters.search);
      query = query.or(`merchant.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
    }
    if (filters.type) {
      query = query.eq("type", filters.type);
    }
    if (filters.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }
    if (filters.fromDate) {
      query = query.gte("transaction_date", filters.fromDate);
    }
    if (filters.toDate) {
      query = query.lte("transaction_date", filters.toDate);
    }

    const limit = Math.min(filters.limit ?? 50, 100);
    const offset = filters.offset ?? 0;
    const { data, error } = await query.range(offset, offset + limit - 1);
    if (error) {
      throw new Error(`Failed to query transactions: ${error.message}`);
    }
    return (data ?? []).map((row) => toRecord(row as TransactionRow));
  }
}
