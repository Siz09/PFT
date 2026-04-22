import type { TransactionRecord } from "./finance";

export type BudgetRecord = {
  categoryId: string;
  amountCents: number;
  month: string;
};

export type BudgetStatus = {
  categoryId: string;
  budgetCents: number;
  spentCents: number;
  remainingCents: number;
  ratio: number;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export class BudgetService {
  getStatus(params: { month: string; transactions: TransactionRecord[]; budgets: BudgetRecord[] }): BudgetStatus[] {
    const { month, transactions, budgets } = params;
    const spentByCategory = new Map<string, number>();

    for (const tx of transactions) {
      if (tx.type !== "expense" || !tx.date.startsWith(month)) {
        continue;
      }
      spentByCategory.set(tx.categoryId, (spentByCategory.get(tx.categoryId) ?? 0) + tx.amountCents);
    }

    return budgets
      .filter((budget) => budget.month === month)
      .map((budget) => {
        const spentCents = spentByCategory.get(budget.categoryId) ?? 0;
        const ratio = budget.amountCents > 0 ? clamp(spentCents / budget.amountCents) : 0;
        return {
          categoryId: budget.categoryId,
          budgetCents: budget.amountCents,
          spentCents,
          remainingCents: budget.amountCents - spentCents,
          ratio,
        };
      })
      .sort((a, b) => b.ratio - a.ratio);
  }
}
