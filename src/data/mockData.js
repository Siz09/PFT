export const mockTransactions = [
  {
    id: 1,
    type: 'income',
    amount: 3500,
    category: 'Salary',
    description: 'Monthly salary',
    date: '2024-01-15'
  },
  {
    id: 2,
    type: 'expense',
    amount: 1200,
    category: 'Rent',
    description: 'Monthly rent payment',
    date: '2024-01-01'
  },
  {
    id: 3,
    type: 'expense',
    amount: 450,
    category: 'Food',
    description: 'Groceries and dining',
    date: '2024-01-10'
  },
  {
    id: 4,
    type: 'expense',
    amount: 200,
    category: 'Transportation',
    description: 'Gas and public transport',
    date: '2024-01-08'
  },
  {
    id: 5,
    type: 'expense',
    amount: 150,
    category: 'Entertainment',
    description: 'Movies and subscriptions',
    date: '2024-01-12'
  },
  {
    id: 6,
    type: 'income',
    amount: 500,
    category: 'Freelance',
    description: 'Web development project',
    date: '2024-01-20'
  },
  {
    id: 7,
    type: 'expense',
    amount: 80,
    category: 'Utilities',
    description: 'Electricity bill',
    date: '2024-01-05'
  },
  {
    id: 8,
    type: 'expense',
    amount: 300,
    category: 'Shopping',
    description: 'Clothes and accessories',
    date: '2024-01-18'
  }
];

export const mockBudgets = [
  {
    id: 1,
    category: 'Food',
    amount: 600,
    spent: 450,
    color: '#22C55E'
  },
  {
    id: 2,
    category: 'Transportation',
    amount: 300,
    spent: 200,
    color: '#3B82F6'
  },
  {
    id: 3,
    category: 'Entertainment',
    amount: 200,
    spent: 150,
    color: '#F59E0B'
  },
  {
    id: 4,
    category: 'Shopping',
    amount: 400,
    spent: 300,
    color: '#EF4444'
  },
  {
    id: 5,
    category: 'Utilities',
    amount: 150,
    spent: 80,
    color: '#8B5CF6'
  }
];

export const categories = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Rent',
  'Healthcare',
  'Education',
  'Travel',
  'Other'
];

export const incomeCategories = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Gift',
  'Other'
];