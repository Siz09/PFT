import { TransactionService, ValidationError, type CreateTransactionInput, type TransactionQueryFilters } from "@smartspend/domain";
import { NextResponse } from "next/server";

import { SupabaseTransactionRepository } from "@/lib/server/transaction-repository";

const service = new TransactionService(new SupabaseTransactionRepository());

const parsePositiveInt = (value: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }
  if (!/^\d+$/.test(value)) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
};

const isTransactionType = (value: unknown): value is "income" | "expense" => value === "income" || value === "expense";

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const validateCreateTransactionBody = (body: unknown): CreateTransactionInput | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as Record<string, unknown>;
  if (!Number.isInteger(candidate.amountCents) || (candidate.amountCents as number) <= 0) {
    return null;
  }
  if (!isTransactionType(candidate.type)) {
    return null;
  }
  if (typeof candidate.categoryId !== "string" || !candidate.categoryId.trim()) {
    return null;
  }
  if (typeof candidate.date !== "string" || !isIsoDate(candidate.date)) {
    return null;
  }
  if (candidate.merchant !== undefined && candidate.merchant !== null && typeof candidate.merchant !== "string") {
    return null;
  }
  if (candidate.description !== undefined && candidate.description !== null && typeof candidate.description !== "string") {
    return null;
  }
  if (candidate.tags !== undefined && (!Array.isArray(candidate.tags) || candidate.tags.some((tag) => typeof tag !== "string"))) {
    return null;
  }
  if (candidate.receiptPath !== undefined && candidate.receiptPath !== null && typeof candidate.receiptPath !== "string") {
    return null;
  }
  if (
    candidate.ocrConfidence !== undefined &&
    candidate.ocrConfidence !== null &&
    (typeof candidate.ocrConfidence !== "number" || !Number.isFinite(candidate.ocrConfidence))
  ) {
    return null;
  }

  return {
    amountCents: candidate.amountCents as number,
    type: candidate.type,
    categoryId: candidate.categoryId.trim(),
    merchant: (candidate.merchant as string | null | undefined) ?? undefined,
    description: (candidate.description as string | null | undefined) ?? undefined,
    date: candidate.date,
    tags: candidate.tags as string[] | undefined,
    receiptPath: (candidate.receiptPath as string | null | undefined) ?? undefined,
    ocrConfidence: (candidate.ocrConfidence as number | null | undefined) ?? undefined,
  };
};

const toFilters = (request: Request): TransactionQueryFilters => {
  const { searchParams } = new URL(request.url);
  const rawType = searchParams.get("type");
  const type = isTransactionType(rawType) ? rawType : undefined;

  return {
    search: searchParams.get("search") ?? undefined,
    type,
    categoryId: searchParams.get("categoryId") ?? undefined,
    fromDate: searchParams.get("fromDate") ?? undefined,
    toDate: searchParams.get("toDate") ?? undefined,
    limit: parsePositiveInt(searchParams.get("limit")),
    offset: parsePositiveInt(searchParams.get("offset")),
  };
};

export async function GET(request: Request) {
  try {
    const filters = toFilters(request);
    const transactions = await service.query(filters);
    return NextResponse.json({ transactions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = validateCreateTransactionBody(body);
    if (!payload) {
      return NextResponse.json({ error: "Invalid transaction payload" }, { status: 400 });
    }
    const transaction = await service.create(payload);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = error instanceof ValidationError || error instanceof SyntaxError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
