import * as SQLite from 'expo-sqlite';

import { MIGRATIONS } from './migrations';
import { DEFAULT_CATEGORIES } from './schema';

const DATABASE_NAME = 'smartspend.db';

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

class DatabaseManager {
  private dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

  async getDatabase() {
    if (!this.dbPromise) {
      this.dbPromise = this.initialize();
    }

    return this.dbPromise;
  }

  private async initialize() {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await this.runMigrations(db);
    await this.seedDefaultCategories(db);
    return db;
  }

  private async runMigrations(db: SQLite.SQLiteDatabase) {
    const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    const currentVersion = result?.user_version ?? 0;
    const pending = MIGRATIONS.filter((migration) => migration.version > currentVersion).sort(
      (a, b) => a.version - b.version
    );

    for (const migration of pending) {
      await db.execAsync('BEGIN;');
      try {
        await migration.up(db);
        await db.execAsync(`PRAGMA user_version = ${migration.version};`);
        await db.execAsync('COMMIT;');
      } catch (error) {
        await db.execAsync('ROLLBACK;');
        throw error;
      }
    }
  }

  private async seedDefaultCategories(db: SQLite.SQLiteDatabase) {
    for (const category of DEFAULT_CATEGORIES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO categories (id, name, icon, color, is_system)
         VALUES (?, ?, ?, ?, ?);`,
        createId(),
        category.name,
        category.icon,
        category.color,
        category.isSystem ? 1 : 0
      );
    }
  }
}

export const databaseManager = new DatabaseManager();
