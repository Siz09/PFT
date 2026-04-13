import { v001InitialMigration } from './v001_initial';
import type { Migration } from './types';

export const MIGRATIONS: Migration[] = [v001InitialMigration];
