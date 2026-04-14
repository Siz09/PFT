import assert from "node:assert/strict";
import test from "node:test";

import { parseOcrJson } from "../src/OCRService";

type Sample = {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  description: string;
  confidence: number;
};

const samples: Sample[] = [
  { merchant: "Metro Market", amount: 42.1, date: "2026-04-01", category: "Food", description: "Groceries", confidence: 0.92 },
  { merchant: "Shell Fuel", amount: 58.33, date: "2026-04-02", category: "Fuel", description: "Car fuel", confidence: 0.9 },
  { merchant: "City Rail", amount: 6.4, date: "2026-04-03", category: "Transport", description: "Train fare", confidence: 0.86 },
  { merchant: "Pharma Plus", amount: 18.75, date: "2026-04-04", category: "Pharmacy", description: "Medicine", confidence: 0.88 },
  { merchant: "Electric Co", amount: 112.09, date: "2026-04-05", category: "Utilities", description: "Power bill", confidence: 0.91 },
  { merchant: "Water Board", amount: 29.4, date: "2026-04-06", category: "Utilities", description: "Water bill", confidence: 0.85 },
  { merchant: "Cinema Hub", amount: 24.5, date: "2026-04-07", category: "Entertainment", description: "Movie tickets", confidence: 0.84 },
  { merchant: "SuperMart", amount: 75.63, date: "2026-04-08", category: "Groceries", description: "Weekly food", confidence: 0.93 },
  { merchant: "Coffee Spot", amount: 8.9, date: "2026-04-09", category: "Restaurant", description: "Coffee", confidence: 0.83 },
  { merchant: "Clinic One", amount: 67.0, date: "2026-04-10", category: "Health", description: "Consultation", confidence: 0.82 },
  { merchant: "Online Shop", amount: 129.99, date: "2026-04-11", category: "Shopping", description: "Household items", confidence: 0.91 },
  { merchant: "Bus Transit", amount: 3.25, date: "2026-04-12", category: "Transport", description: "Bus ride", confidence: 0.79 },
  { merchant: "Book Store", amount: 22.15, date: "2026-04-13", category: "Shopping", description: "Books", confidence: 0.88 },
  { merchant: "Farm Fresh", amount: 31.7, date: "2026-04-14", category: "Food", description: "Produce", confidence: 0.87 },
  { merchant: "Music World", amount: 14.99, date: "2026-04-15", category: "Entertainment", description: "Streaming card", confidence: 0.8 },
  { merchant: "Petrol One", amount: 51.11, date: "2026-04-16", category: "Transport", description: "Fuel top-up", confidence: 0.9 },
  { merchant: "Dental Care", amount: 145.0, date: "2026-04-17", category: "Medical", description: "Dental visit", confidence: 0.87 },
  { merchant: "Quick Eats", amount: 12.35, date: "2026-04-18", category: "Food", description: "Lunch", confidence: 0.85 },
  { merchant: "Net Provider", amount: 69.0, date: "2026-04-19", category: "Utilities", description: "Internet bill", confidence: 0.86 },
  { merchant: "Travel Cab", amount: 19.2, date: "2026-04-20", category: "Transport", description: "Taxi ride", confidence: 0.81 },
  { merchant: "Mega Grocery", amount: 95.45, date: "2026-04-21", category: "Food", description: "Family groceries", confidence: 0.94 },
];

const expectedCategory = (value: string) => {
  const key = value.toLowerCase();
  if (["food", "groceries", "restaurant"].includes(key)) return "Food";
  if (["fuel", "transport"].includes(key)) return "Transport";
  if (["health", "medical", "pharmacy"].includes(key)) return "Health";
  if (key === "utilities") return "Utilities";
  if (key === "entertainment") return "Entertainment";
  if (key === "shopping") return "Shopping";
  return "Other";
};

test("ocr parser synthetic receipt accuracy stays above 90%", () => {
  let matchedFields = 0;
  const totalFields = samples.length * 5;

  for (const sample of samples) {
    const parsed = parseOcrJson(JSON.stringify(sample));
    if (parsed.merchant === sample.merchant) matchedFields += 1;
    if (parsed.amountCents === Math.round(sample.amount * 100)) matchedFields += 1;
    if (parsed.date === sample.date) matchedFields += 1;
    if (parsed.categoryId === expectedCategory(sample.category)) matchedFields += 1;
    if (parsed.description === sample.description) matchedFields += 1;
  }

  const accuracy = matchedFields / totalFields;
  assert.ok(accuracy > 0.9, `Expected >90% field accuracy, got ${(accuracy * 100).toFixed(2)}%`);
});
