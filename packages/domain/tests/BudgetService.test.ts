import assert from "node:assert/strict";
import test from "node:test";

import { BudgetService } from "../src/BudgetService";
import type { TransactionRecord } from "../src/finance";

const tx = (overrides: Partial<TransactionRecord>): TransactionRecord => ({
  id: "id",
  amountCents: 1000,
  type: "expense",
  categoryId: "food",
  categoryName: "Food",
  merchant: null,
  description: null,
  date: "2026-04-10",
  receiptPath: null,
  ocrConfidence: null,
  isRecurring: false,
  recurringId: null,
  tags: [],
  createdAt: "2026-04-10T00:00:00.000Z",
  updatedAt: "2026-04-10T00:00:00.000Z",
  ...overrides,
});

test("getStatus computes spent and remaining by category", () => {
  const service = new BudgetService();
  const statuses = service.getStatus({
    month: "2026-04",
    transactions: [
      tx({ id: "1", categoryId: "food", amountCents: 1500 }),
      tx({ id: "2", categoryId: "food", amountCents: 500 }),
      tx({ id: "3", categoryId: "transport", amountCents: 700 }),
      tx({ id: "4", categoryId: "food", date: "2026-05-01", amountCents: 999 }),
      tx({ id: "5", categoryId: "food", type: "income", amountCents: 2000 }),
    ],
    budgets: [
      { month: "2026-04", categoryId: "food", amountCents: 3000 },
      { month: "2026-04", categoryId: "transport", amountCents: 600 },
    ],
  });

  assert.equal(statuses.length, 2);
  assert.equal(statuses[0]?.categoryId, "transport");
  assert.equal(statuses[0]?.spentCents, 700);
  assert.equal(statuses[0]?.remainingCents, -100);
  assert.equal(statuses[1]?.categoryId, "food");
  assert.equal(statuses[1]?.spentCents, 2000);
});
