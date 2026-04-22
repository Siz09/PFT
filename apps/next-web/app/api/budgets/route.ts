import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const isMonth = (value: string) => /^\d{4}-\d{2}$/.test(value);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
    if (!isMonth(month)) {
      return NextResponse.json({ error: "Invalid month. Expected YYYY-MM." }, { status: 400 });
    }
    const client = createSupabaseServiceRoleClient();
    const { data, error } = await client
      .from("budgets")
      .select("id, category_id, month, amount_cents, created_at, updated_at")
      .eq("month", month)
      .order("category_id", { ascending: true });
    if (error) {
      throw new Error(error.message);
    }
    return NextResponse.json({
      budgets: (data ?? []).map((row) => ({
        id: row.id,
        categoryId: row.category_id,
        month: row.month,
        amountCents: row.amount_cents,
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
    const body = (await request.json()) as {
      categoryId?: string;
      month?: string;
      amountCents?: number;
    };
    const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
    const month = typeof body.month === "string" ? body.month : "";
    const amountCentsValue = typeof body.amountCents === "number" ? body.amountCents : Number.NaN;
    if (!categoryId || !month || !isMonth(month) || !Number.isInteger(amountCentsValue) || amountCentsValue <= 0) {
      return NextResponse.json({ error: "Invalid budget payload" }, { status: 400 });
    }
    const client = createSupabaseServiceRoleClient();
    const now = new Date().toISOString();
    const { data, error } = await client
      .from("budgets")
      .upsert(
        {
          category_id: categoryId,
          month,
          amount_cents: amountCentsValue,
          updated_at: now,
        },
        { onConflict: "category_id,month" }
      )
      .select("id, category_id, month, amount_cents, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return NextResponse.json(
      {
        budget: {
          id: data.id,
          categoryId: data.category_id,
          month: data.month,
          amountCents: data.amount_cents,
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
