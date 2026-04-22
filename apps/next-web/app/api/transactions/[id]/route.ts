import { TransactionService, ValidationError, type UpdateTransactionInput } from "@smartspend/domain";
import { NextResponse } from "next/server";

import { SupabaseTransactionRepository } from "@/lib/server/transaction-repository";

const service = new TransactionService(new SupabaseTransactionRepository());

const isTransactionType = (value: unknown): value is "income" | "expense" => value === "income" || value === "expense";
const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const validateUpdateTransactionBody = (body: unknown): UpdateTransactionInput | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as Record<string, unknown>;
  const payload: UpdateTransactionInput = {};

  if (candidate.amountCents !== undefined) {
    if (!Number.isInteger(candidate.amountCents) || (candidate.amountCents as number) <= 0) {
      return null;
    }
    payload.amountCents = candidate.amountCents as number;
  }
  if (candidate.type !== undefined) {
    if (!isTransactionType(candidate.type)) {
      return null;
    }
    payload.type = candidate.type;
  }
  if (candidate.categoryId !== undefined) {
    if (typeof candidate.categoryId !== "string" || !candidate.categoryId.trim()) {
      return null;
    }
    payload.categoryId = candidate.categoryId.trim();
  }
  if (candidate.date !== undefined) {
    if (typeof candidate.date !== "string" || !isIsoDate(candidate.date)) {
      return null;
    }
    payload.date = candidate.date;
  }
  if (candidate.merchant !== undefined) {
    if (candidate.merchant !== null && typeof candidate.merchant !== "string") {
      return null;
    }
    payload.merchant = candidate.merchant as string | null;
  }
  if (candidate.description !== undefined) {
    if (candidate.description !== null && typeof candidate.description !== "string") {
      return null;
    }
    payload.description = candidate.description as string | null;
  }
  if (candidate.tags !== undefined) {
    if (!Array.isArray(candidate.tags) || candidate.tags.some((tag) => typeof tag !== "string")) {
      return null;
    }
    payload.tags = candidate.tags as string[];
  }
  if (candidate.receiptPath !== undefined) {
    if (candidate.receiptPath !== null && typeof candidate.receiptPath !== "string") {
      return null;
    }
    payload.receiptPath = candidate.receiptPath as string | null;
  }
  if (candidate.ocrConfidence !== undefined) {
    if (candidate.ocrConfidence !== null && (typeof candidate.ocrConfidence !== "number" || !Number.isFinite(candidate.ocrConfidence))) {
      return null;
    }
    payload.ocrConfidence = candidate.ocrConfidence as number | null;
  }

  return payload;
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const payload = validateUpdateTransactionBody(body);
    if (!payload) {
      return NextResponse.json({ error: "Invalid transaction payload" }, { status: 400 });
    }
    const transaction = await service.update(id, payload);
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    return NextResponse.json({ transaction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = error instanceof ValidationError || error instanceof SyntaxError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await service.delete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = error instanceof ValidationError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
