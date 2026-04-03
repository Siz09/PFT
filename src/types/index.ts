export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
  recurringId?: string;
  createdAt: Date;
  updatedAt?: Date;
  userId?: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  createdAt: Date;
  userId?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  category?: string;
  description?: string;
  createdAt: Date;
  userId?: string;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: Date;
  isActive: boolean;
  tags?: string[];
  createdAt: Date;
  userId?: string;
}

export interface Category {
  id: string;
  name: string;
  userId?: string;
}

export interface FinancialSummary {
  income: number;
  expenses: number;
  balance: number;
}

export type Theme = 'light' | 'dark' | 'system';

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface MonthlyDataPoint {
  name: string;
  income: number;
  expense: number;
}

export type ChartType = 'bar' | 'line' | 'pie';

export interface TransactionFilters {
  search: string;
  type: TransactionType | '';
  category: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

export interface AuthResult {
  success: boolean;
  user?: import('firebase/auth').User;
  error?: string;
  needsVerification?: boolean;
}
