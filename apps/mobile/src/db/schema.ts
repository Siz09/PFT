import type { Category } from '../types/finance';

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food', icon: 'utensils', color: '#EF4444', isSystem: true },
  { name: 'Transport', icon: 'car', color: '#3B82F6', isSystem: true },
  { name: 'Health', icon: 'heart', color: '#10B981', isSystem: true },
  { name: 'Entertainment', icon: 'film', color: '#8B5CF6', isSystem: true },
  { name: 'Shopping', icon: 'shopping-bag', color: '#F59E0B', isSystem: true },
  { name: 'Utilities', icon: 'bolt', color: '#06B6D4', isSystem: true },
  { name: 'Salary', icon: 'wallet', color: '#22C55E', isSystem: true },
];
