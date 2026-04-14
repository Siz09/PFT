import assert from "node:assert/strict";
import test from "node:test";

import { OCRParsingError, OCRScanError, OCRService, calculateConfidenceScore, parseOcrJson } from "../src/OCRService";

test("parseOcrJson parses valid JSON payload", () => {
  const result = parseOcrJson(
    JSON.stringify({
      merchant: "Grocery Mart",
      amount: 14.35,
      date: "2026-04-10",
      category: "Food",
      description: "Weekly groceries",
      confidence: 0.91,
    })
  );

  assert.equal(result.merchant, "Grocery Mart");
  assert.equal(result.amountCents, 1435);
  assert.equal(result.date, "2026-04-10");
  assert.equal(result.categoryId, "Food");
  assert.equal(result.description, "Weekly groceries");
  assert.equal(result.confidence, 0.91);
});

test("parseOcrJson rejects invalid date values", () => {
  assert.throws(
    () =>
      parseOcrJson(
        JSON.stringify({
          merchant: "Cafe",
          amount: 8.25,
          date: "2026-02-30",
          category: "Food",
          description: "Coffee",
          confidence: 0.88,
        })
      ),
    OCRParsingError
  );
});

test("calculateConfidenceScore penalizes missing fields", () => {
  const score = calculateConfidenceScore({
    merchant: "",
    amountCents: 2350,
    date: "2026-04-10",
    categoryId: "",
    description: "",
    confidence: 0.95,
  });

  assert.equal(score, 0.57);
});

test("scan uses OpenAI when online and maps result", async () => {
  const service = new OCRService({
    isOnline: async () => true,
    scanWithOpenAI: async () =>
      JSON.stringify({
        merchant: "Metro Fuel",
        amount: 52.7,
        date: "2026-04-11",
        category: "Transport",
        description: "Fuel",
        confidence: 0.93,
      }),
    scanWithOfflineOcr: async () => {
      throw new Error("Should not call fallback");
    },
  });

  const result = await service.scan({
    imageUri: "file://receipt.jpg",
    mimeType: "image/jpeg",
    source: "camera",
  });

  assert.equal(result.provider, "openai");
  assert.equal(result.fields.amountCents, 5270);
  assert.equal(result.fields.categoryId, "Transport");
  assert.equal(result.fields.confidence, 0.93);
});

test("scan uses offline OCR path when device offline", async () => {
  const service = new OCRService({
    isOnline: async () => false,
    scanWithOpenAI: async () => {
      throw new OCRScanError("OpenAI request failed");
    },
    scanWithOfflineOcr: async () =>
      JSON.stringify({
        merchant: "Water Utility",
        amount: 61.2,
        date: "2026-04-12",
        category: "Utilities",
        description: "Monthly bill",
        confidence: 0.73,
      }),
  });

  const result = await service.scan({
    imageUri: "file://bill.jpg",
    mimeType: "image/jpeg",
    source: "gallery",
  });

  assert.equal(result.provider, "mlkit");
  assert.equal(result.fields.amountCents, 6120);
  assert.equal(result.fields.categoryId, "Utilities");
});
