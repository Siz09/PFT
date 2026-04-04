// Core domain types for SmartSpend
// Expanded in Week 2 when DB schema is implemented

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  categoryId: string;
  date: string; // ISO 8601
  merchant?: string;
  notes?: string;
  receiptImagePath?: string;
  isRecurring: boolean;
  recurringId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'weekly' | 'monthly';
  startDate: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  createdAt: string;
}

export interface AISummary {
  id: string;
  periodType: 'weekly' | 'monthly';
  periodStart: string;
  periodEnd: string;
  overview: string;
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
  anomalies: string[];
  tips: string[];
  savingsRate: number;
  generatedAt: string;
}
