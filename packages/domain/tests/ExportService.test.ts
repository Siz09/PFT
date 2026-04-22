import assert from "node:assert/strict";
import test from "node:test";

import { ExportService } from "../src/ExportService";
import type { TransactionRecord } from "../src/finance";

const sampleTx: TransactionRecord = {
  id: "tx-1",
  amountCents: 1234,
  type: "expense",
  categoryId: "food",
  categoryName: "Food",
  merchant: "Cafe, Inc.",
  description: 'Quote "test"',
  date: "2026-04-12",
  receiptPath: null,
  ocrConfidence: 0.9,
  isRecurring: false,
  recurringId: null,
  tags: [],
  createdAt: "2026-04-12T00:00:00.000Z",
  updatedAt: "2026-04-12T00:00:00.000Z",
};

test("toCsv escapes commas and quotes", () => {
  const service = new ExportService();
  const csv = service.toCsv([sampleTx]);
  assert.match(csv, /"Cafe, Inc\."/);
  assert.match(csv, /"Quote ""test"""/);
});

test("toJson returns pretty json", () => {
  const service = new ExportService();
  const json = service.toJson([sampleTx]);
  assert.match(json, /"id": "tx-1"/);
});
