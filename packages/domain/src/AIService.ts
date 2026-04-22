import type { TransactionRecord } from "./finance";

export type SummaryPeriod = "weekly" | "monthly";

export type SummaryPayload = {
  period: SummaryPeriod;
  startDate: string;
  endDate: string;
  totalIncomeCents: number;
  totalExpenseCents: number;
  netCents: number;
  txCount: number;
  categories: Array<{ categoryId: string; categoryName: string; expenseCents: number }>;
  topMerchants: Array<{ merchant: string; expenseCents: number }>;
};

export type SummaryModelResponse = {
  overview: string;
  top_categories: Array<{ category: string; amountCents: number }>;
  anomalies: string[];
  tips: string[];
  savings_rate: number;
};

type AIServicePorts = {
  generateSummary: (payload: SummaryPayload) => Promise<SummaryModelResponse>;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const startOfWeekIso = (value: Date) => {
  const date = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
};

const endOfWeekIso = (value: Date) => {
  const start = new Date(`${startOfWeekIso(value)}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() + 6);
  return start.toISOString().slice(0, 10);
};

const startOfMonthIso = (value: Date) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1)).toISOString().slice(0, 10);

const endOfMonthIso = (value: Date) =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);

export class AIService {
  constructor(private readonly ports: AIServicePorts) {}

  buildSummaryPayload(params: {
    period: SummaryPeriod;
    transactions: TransactionRecord[];
    startDate: string;
    endDate: string;
  }): SummaryPayload {
    const expenseByCategory = new Map<string, { categoryName: string; expenseCents: number }>();
    const expenseByMerchant = new Map<string, number>();
    let totalIncomeCents = 0;
    let totalExpenseCents = 0;

    for (const tx of params.transactions) {
      if (tx.type === "income") {
        totalIncomeCents += tx.amountCents;
        continue;
      }
      totalExpenseCents += tx.amountCents;
      const categoryName = tx.categoryName ?? tx.categoryId;
      const categoryBucket = expenseByCategory.get(tx.categoryId) ?? { categoryName, expenseCents: 0 };
      categoryBucket.expenseCents += tx.amountCents;
      expenseByCategory.set(tx.categoryId, categoryBucket);

      if (tx.merchant) {
        expenseByMerchant.set(tx.merchant, (expenseByMerchant.get(tx.merchant) ?? 0) + tx.amountCents);
      }
    }

    return {
      period: params.period,
      startDate: params.startDate,
      endDate: params.endDate,
      totalIncomeCents,
      totalExpenseCents,
      netCents: totalIncomeCents - totalExpenseCents,
      txCount: params.transactions.length,
      categories: [...expenseByCategory.entries()]
        .map(([categoryId, bucket]) => ({ categoryId, categoryName: bucket.categoryName, expenseCents: bucket.expenseCents }))
        .sort((a, b) => b.expenseCents - a.expenseCents),
      topMerchants: [...expenseByMerchant.entries()]
        .map(([merchant, expenseCents]) => ({ merchant, expenseCents }))
        .sort((a, b) => b.expenseCents - a.expenseCents)
        .slice(0, 5),
    };
  }

  async generateWeeklySummary(transactions: TransactionRecord[], referenceDate: Date = new Date()) {
    const startDate = startOfWeekIso(referenceDate);
    const endDate = endOfWeekIso(referenceDate);
    const payload = this.buildSummaryPayload({ period: "weekly", transactions, startDate, endDate });
    const summary = await this.ports.generateSummary(payload);
    return this.normalizeSummary(summary);
  }

  async generateMonthlySummary(transactions: TransactionRecord[], referenceDate: Date = new Date()) {
    const startDate = startOfMonthIso(referenceDate);
    const endDate = endOfMonthIso(referenceDate);
    const payload = this.buildSummaryPayload({ period: "monthly", transactions, startDate, endDate });
    const summary = await this.ports.generateSummary(payload);
    return this.normalizeSummary(summary);
  }

  private normalizeSummary(summary: SummaryModelResponse): SummaryModelResponse {
    return {
      ...summary,
      savings_rate: clamp(summary.savings_rate, 0, 1),
      tips: summary.tips.slice(0, 3),
      anomalies: summary.anomalies.slice(0, 5),
      top_categories: summary.top_categories.slice(0, 5),
    };
  }
}
