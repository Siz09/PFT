export type Category =
  | 'Groceries'
  | 'Salary'
  | 'Transport'
  | 'Dining & Drinks'
  | 'Shopping'
  | 'Subscriptions'
  | 'Retail & Fashion'
  | 'Utilities'
  | 'Health'
  | 'Travel'
  | 'Other';

export type GoalCategory = 'Property' | 'Travel' | 'Savings';

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: Category;
  date: string; // ISO string
  type: 'income' | 'expense';
}

export interface Budget {
  category: Category;
  spent: number;
  limit: number;
  status: 'Healthy' | 'Watch out' | 'Near limit';
}

export interface Goal {
  id: string;
  name: string;
  category: GoalCategory;
  current: number;
  target: number;
  daysLeft: number;
}

export interface WeeklyInsight {
  savingsRate: number;
  vsGoal: number;
  summary: string;
  topCategories: { category: Category; amount: number; change: number }[];
  anomalies: { title: string; description: string }[];
  tips: { title: string; description: string }[];
}
