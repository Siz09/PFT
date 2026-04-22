import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

type RecurringRulePayload = {
  type?: "income" | "expense";
  amountCents?: number;
  categoryId?: string;
  merchant?: string | null;
  description?: string | null;
  frequency?: "daily" | "weekly" | "monthly";
  nextDue?: string;
  active?: boolean;
};

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export async function GET() {
  try {
    const client = createSupabaseServiceRoleClient();
    const { data, error } = await client
      .from("recurring_rules")
      .select("id, type, amount_cents, category_id, merchant, description, frequency, next_due, active, created_at, updated_at")
      .order("next_due", { ascending: true });
    if (error) {
      throw new Error(error.message);
    }
    return NextResponse.json({
      recurringRules: (data ?? []).map((row) => ({
        id: row.id,
        type: row.type,
        amountCents: row.amount_cents,
        categoryId: row.category_id,
        merchant: row.merchant,
        description: row.description,
        frequency: row.frequency,
        nextDue: row.next_due,
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecurringRulePayload;
    if (
      (body.type !== "income" && body.type !== "expense") ||
      !Number.isInteger(body.amountCents) ||
      (body.amountCents as number) <= 0 ||
      typeof body.categoryId !== "string" ||
      !body.categoryId.trim() ||
      (body.frequency !== "daily" && body.frequency !== "weekly" && body.frequency !== "monthly") ||
      typeof body.nextDue !== "string" ||
      !isIsoDate(body.nextDue)
    ) {
      return NextResponse.json({ error: "Invalid recurring rule payload" }, { status: 400 });
    }

    const client = createSupabaseServiceRoleClient();
    const now = new Date().toISOString();
    const { data, error } = await client
      .from("recurring_rules")
      .insert({
        type: body.type,
        amount_cents: body.amountCents,
        category_id: body.categoryId.trim(),
        merchant: body.merchant ?? null,
        description: body.description ?? null,
        frequency: body.frequency,
        next_due: body.nextDue,
        active: body.active ?? true,
        updated_at: now,
      })
      .select("id, type, amount_cents, category_id, merchant, description, frequency, next_due, active, created_at, updated_at")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return NextResponse.json(
      {
        recurringRule: {
          id: data.id,
          type: data.type,
          amountCents: data.amount_cents,
          categoryId: data.category_id,
          merchant: data.merchant,
          description: data.description,
          frequency: data.frequency,
          nextDue: data.next_due,
          active: data.active,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = error instanceof SyntaxError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
