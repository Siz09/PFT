import test from 'node:test';
import assert from 'node:assert/strict';

import { TransactionService, type TransactionRepositoryPort } from './TransactionService';

const createRepositoryMock = (): TransactionRepositoryPort => ({
  create: async (payload) => ({
    ...payload,
    categoryId: payload.categoryId,
    merchant: payload.merchant ?? null,
    description: payload.description ?? null,
    receiptPath: null,
    ocrConfidence: null,
    isRecurring: false,
    recurringId: null,
    tags: payload.tags ?? [],
    type: payload.type,
    amountCents: payload.amountCents,
    date: payload.date,
  }),
  update: async (_id, _input) => null,
  delete: async () => undefined,
  query: async () => [],
});

test('create validates positive amount', async () => {
  const service = new TransactionService(createRepositoryMock());

  await assert.rejects(
    () =>
      service.create({
        amountCents: 0,
        categoryId: 'Food',
        date: '2026-01-01',
        type: 'expense',
      }),
    /Amount must be greater than 0/
  );
});

test('create validates date format', async () => {
  const service = new TransactionService(createRepositoryMock());

  await assert.rejects(
    () =>
      service.create({
        amountCents: 1400,
        categoryId: 'Food',
        date: '01-01-2026',
        type: 'expense',
      }),
    /Date must be in YYYY-MM-DD format/
  );
});

test('create validates impossible calendar dates', async () => {
  const service = new TransactionService(createRepositoryMock());

  await assert.rejects(
    () =>
      service.create({
        amountCents: 1400,
        categoryId: 'Food',
        date: '2026-02-30',
        type: 'expense',
      }),
    /Invalid calendar date/
  );
});

test('create delegates to repository when payload valid', async () => {
  const service = new TransactionService(createRepositoryMock());
  const result = await service.create({
    amountCents: 2000,
    categoryId: 'Food',
    date: '2026-01-01',
    merchant: 'Cafe',
    type: 'expense',
  });

  assert.ok(result);
  assert.equal(result?.merchant, 'Cafe');
  assert.equal(result?.amountCents, 2000);
  assert.equal(result?.type, 'expense');
});
