import type * as SQLite from 'expo-sqlite';

export type Migration = {
  version: number;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
};
