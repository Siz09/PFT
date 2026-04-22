import { ExportService, TransactionService } from "@smartspend/domain";
import { NextResponse } from "next/server";

import { SupabaseTransactionRepository } from "@/lib/server/transaction-repository";

const txService = new TransactionService(new SupabaseTransactionRepository());
const exportService = new ExportService();

const asInt = (value: string | null) => {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }
  return Number(value);
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") === "json" ? "json" : "csv";
    const transactions = await txService.query({
      search: searchParams.get("search") ?? undefined,
      type: searchParams.get("type") === "income" || searchParams.get("type") === "expense" ? (searchParams.get("type") as "income" | "expense") : undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      fromDate: searchParams.get("fromDate") ?? undefined,
      toDate: searchParams.get("toDate") ?? undefined,
      limit: asInt(searchParams.get("limit")) ?? 1000,
      offset: asInt(searchParams.get("offset")) ?? 0,
    });

    if (format === "json") {
      return new NextResponse(exportService.toJson(transactions), {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-disposition": "attachment; filename=transactions.json",
        },
      });
    }

    return new NextResponse(exportService.toCsv(transactions), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=transactions.csv",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
