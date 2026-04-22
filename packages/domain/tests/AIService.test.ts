import assert from "node:assert/strict";
import test from "node:test";

import { AIService, type SummaryPayload } from "../src/AIService";
import type { TransactionRecord } from "../src/finance";

const tx = (overrides: Partial<TransactionRecord>): TransactionRecord => ({
  id: "t1",
  amountCents: 1000,
  type: "expense",
  categoryId: "food",
  categoryName: "Food",
  merchant: "Cafe",
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

test("buildSummaryPayload aggregates totals and categories", () => {
  const service = new AIService({
    generateSummary: async () => ({
      overview: "",
      top_categories: [],
      anomalies: [],
      tips: [],
      savings_rate: 0,
    }),
  });

  const payload = service.buildSummaryPayload({
    period: "weekly",
    startDate: "2026-04-07",
    endDate: "2026-04-13",
    transactions: [
      tx({ id: "1", type: "income", amountCents: 50000, categoryId: "income", categoryName: "Income", merchant: "Salary" }),
      tx({ id: "2", amountCents: 1200, categoryId: "food", categoryName: "Food" }),
      tx({ id: "3", amountCents: 800, categoryId: "transport", categoryName: "Transport", merchant: "Metro" }),
    ],
  });

  assert.equal(payload.totalIncomeCents, 50000);
  assert.equal(payload.totalExpenseCents, 2000);
  assert.equal(payload.netCents, 48000);
  assert.equal(payload.categories[0]?.categoryId, "food");
  assert.equal(payload.topMerchants.length, 2);
});

test("generateWeeklySummary caps tips and clamps savings rate", async () => {
  let captured: SummaryPayload | null = null;
  const service = new AIService({
    generateSummary: async (payload) => {
      captured = payload;
      return {
        overview: "Good week",
        top_categories: [
          { category: "Food", amountCents: 1000 },
          { category: "Transport", amountCents: 500 },
        ],
        anomalies: ["Spike 1", "Spike 2", "Spike 3", "Spike 4", "Spike 5", "Spike 6"],
        tips: ["Tip 1", "Tip 2", "Tip 3", "Tip 4"],
        savings_rate: 1.4,
      };
    },
  });

  const result = await service.generateWeeklySummary([tx({ amountCents: 1000 })], new Date("2026-04-10T00:00:00.000Z"));
  assert.equal(captured?.period, "weekly");
  assert.equal(result.tips.length, 3);
  assert.equal(result.anomalies.length, 5);
  assert.equal(result.savings_rate, 1);
});
