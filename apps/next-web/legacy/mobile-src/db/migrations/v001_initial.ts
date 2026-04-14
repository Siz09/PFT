import type { Migration } from './types';

export const v001InitialMigration: Migration = {
  version: 1,
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        icon TEXT,
        color TEXT,
        is_system INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income','expense')),
        category_id TEXT REFERENCES categories(id) ON DELETE RESTRICT,
        merchant TEXT,
        description TEXT,
        date TEXT NOT NULL,
        receipt_path TEXT,
        ocr_confidence REAL,
        is_recurring INTEGER NOT NULL DEFAULT 0,
        recurring_id TEXT,
        tags TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        amount INTEGER NOT NULL,
        month TEXT NOT NULL,
        alert_threshold REAL NOT NULL DEFAULT 0.8,
        UNIQUE(category_id, month)
      );

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target_amount INTEGER NOT NULL,
        current_amount INTEGER NOT NULL DEFAULT 0,
        deadline TEXT,
        category_id TEXT REFERENCES categories(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS ai_summaries (
        id TEXT PRIMARY KEY,
        period_type TEXT NOT NULL CHECK (period_type IN ('weekly','monthly')),
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        summary_json TEXT NOT NULL,
        generated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON transactions(is_recurring, recurring_id);
      CREATE INDEX IF NOT EXISTS idx_ai_summaries_period ON ai_summaries(period_type, period_start);
    `);
  },
};
