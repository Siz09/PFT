import assert from 'node:assert/strict';
import test from 'node:test';

import {
  OCRService,
  OCRParsingError,
  OCRScanError,
  calculateConfidenceScore,
  parseOcrResponse,
} from './OCRService';

test('parseOcrResponse parses valid JSON payload', () => {
  const result = parseOcrResponse(
    JSON.stringify({
      merchant: 'Grocery Mart',
      amount: 14.35,
      date: '2026-04-10',
      category: 'Food',
      description: 'Weekly groceries',
      confidence: 0.91,
    })
  );

  assert.equal(result.merchant, 'Grocery Mart');
  assert.equal(result.amountCents, 1435);
  assert.equal(result.date, '2026-04-10');
  assert.equal(result.categoryId, 'Food');
  assert.equal(result.description, 'Weekly groceries');
  assert.equal(result.confidence, 0.91);
});

test('parseOcrResponse rejects invalid date values', () => {
  assert.throws(
    () =>
      parseOcrResponse(
        JSON.stringify({
          merchant: 'Cafe',
          amount: 8.25,
          date: '2026-02-30',
          category: 'Food',
          description: 'Coffee',
          confidence: 0.88,
        })
      ),
    OCRParsingError
  );
});

test('calculateConfidenceScore penalizes missing fields', () => {
  const score = calculateConfidenceScore({
    merchant: '',
    amountCents: 2350,
    date: '2026-04-10',
    categoryId: '',
    description: '',
    confidence: 0.95,
  });

  assert.equal(score, 0.57);
});

test('scan uses OpenAI when online and maps result', async () => {
  const service = new OCRService({
    isOnline: async () => true,
    scanWithOpenAI: async () =>
      JSON.stringify({
        merchant: 'Metro Fuel',
        amount: 52.7,
        date: '2026-04-11',
        category: 'Transport',
        description: 'Fuel',
        confidence: 0.93,
      }),
    scanWithTesseract: async () => {
      throw new Error('Should not call fallback');
    },
  });

  const result = await service.scan({
    imageUri: 'file://receipt.jpg',
    mimeType: 'image/jpeg',
    source: 'camera',
  });

  assert.equal(result.provider, 'openai');
  assert.equal(result.fields.amountCents, 5270);
  assert.equal(result.fields.categoryId, 'Transport');
  assert.equal(result.fields.confidence, 0.93);
});

test('scan uses Tesseract path when device offline', async () => {
  const service = new OCRService({
    isOnline: async () => false,
    scanWithOpenAI: async () => {
      throw new OCRScanError('OpenAI request failed');
    },
    scanWithTesseract: async () =>
      JSON.stringify({
        merchant: 'Water Utility',
        amount: 61.2,
        date: '2026-04-12',
        category: 'Utilities',
        description: 'Monthly bill',
        confidence: 0.73,
      }),
  });

  const result = await service.scan({
    imageUri: 'file://bill.jpg',
    mimeType: 'image/jpeg',
    source: 'gallery',
  });

  assert.equal(result.provider, 'tesseract');
  assert.equal(result.fields.amountCents, 6120);
  assert.equal(result.fields.categoryId, 'Utilities');
});

test('scan surfaces OpenAI errors while online', async () => {
  const service = new OCRService({
    isOnline: async () => true,
    scanWithOpenAI: async () => {
      throw new OCRScanError('Missing EXPO_PUBLIC_OPENAI_API_KEY');
    },
    scanWithTesseract: async () => '',
  });

  await assert.rejects(
    () =>
      service.scan({
        imageUri: 'file://receipt.jpg',
        mimeType: 'image/jpeg',
        source: 'camera',
      }),
    /Missing EXPO_PUBLIC_OPENAI_API_KEY/
  );
});

test('scan throws when no text detected from OCR providers', async () => {
  const service = new OCRService({
    isOnline: async () => false,
    scanWithOpenAI: async () => '',
    scanWithTesseract: async () => '',
  });

  await assert.rejects(
    () =>
      service.scan({
        imageUri: 'file://blur.jpg',
        mimeType: 'image/jpeg',
        source: 'camera',
      }),
    /No text detected/
  );
});
