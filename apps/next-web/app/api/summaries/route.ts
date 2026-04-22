import { AIService, BudgetService, type TransactionRecord } from "@smartspend/domain";
import { NextResponse } from "next/server";

import { generateOpenAISummary } from "@/lib/server/openai-summary-client";
import { SupabaseTransactionRepository } from "@/lib/server/transaction-repository";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const txService = new SupabaseTransactionRepository();
const aiService = new AIService({
  generateSummary: generateOpenAISummary,
});
const budgetService = new BudgetService();

const parseMonth = (value: string | null) => {
  if (!value) {
    return new Date().toISOString().slice(0, 7);
  }
  return /^\d{4}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 7);
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseMonth(searchParams.get("month"));
    const period = searchParams.get("period") === "weekly" ? "weekly" : "monthly";
    const transactionFilters = {
      fromDate: `${month}-01`,
      toDate: `${month}-31`,
      limit: 500,
    };
    const transactions = (await txService.query(transactionFilters)) as TransactionRecord[];

    const supabase = createSupabaseServiceRoleClient();
    const { data: summaryRows, error: summaryError } = await supabase
      .from("ai_summaries")
      .select("id, period_type, period_start, period_end, summary_json, created_at")
      .eq("period_type", period)
      .order("created_at", { ascending: false })
      .limit(10);
    if (summaryError) {
      throw new Error(summaryError.message);
    }

    const { data: budgetRows, error: budgetError } = await supabase
      .from("budgets")
      .select("category_id, amount_cents, month")
      .eq("month", month);
    if (budgetError) {
      throw new Error(budgetError.message);
    }

    const budgetStatus = budgetService.getStatus({
      month,
      transactions,
      budgets: (budgetRows ?? []).map((row) => ({
        categoryId: row.category_id,
        amountCents: row.amount_cents,
        month: row.month,
      })),
    });

    return NextResponse.json({
      summaries: summaryRows ?? [],
      budgetStatus,
      report: {
        month,
        incomeCents: transactions.filter((item) => item.type === "income").reduce((acc, item) => acc + item.amountCents, 0),
        expenseCents: transactions.filter((item) => item.type === "expense").reduce((acc, item) => acc + item.amountCents, 0),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { period?: "weekly" | "monthly"; referenceDate?: string };
    const period = body.period === "weekly" ? "weekly" : "monthly";
    const referenceDate = body.referenceDate ? new Date(`${body.referenceDate}T00:00:00.000Z`) : new Date();
    const month = referenceDate.toISOString().slice(0, 7);
    const transactions = (await txService.query({
      fromDate: `${month}-01`,
      toDate: `${month}-31`,
      limit: 1000,
    })) as TransactionRecord[];

    const summary =
      period === "weekly"
        ? await aiService.generateWeeklySummary(transactions, referenceDate)
        : await aiService.generateMonthlySummary(transactions, referenceDate);

    const startDate = period === "weekly" ? new Date(referenceDate) : new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1));
    const periodStart = period === "weekly" ? new Date(startDate.setUTCDate(startDate.getUTCDate() - ((startDate.getUTCDay() + 6) % 7))) : startDate;
    const periodEnd = new Date(periodStart);
    if (period === "weekly") {
      periodEnd.setUTCDate(periodEnd.getUTCDate() + 6);
    } else {
      periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1, 0);
    }

    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("ai_summaries")
      .insert({
        period_type: period,
        period_start: periodStart.toISOString().slice(0, 10),
        period_end: periodEnd.toISOString().slice(0, 10),
        summary_json: summary,
      })
      .select("id, period_type, period_start, period_end, summary_json, created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return NextResponse.json({ summary: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = error instanceof SyntaxError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
