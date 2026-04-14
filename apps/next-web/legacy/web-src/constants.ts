import { Transaction, Budget, Goal, WeeklyInsight } from './types';

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    merchant: 'Whole Foods',
    amount: 142.30,
    category: 'Groceries',
    date: '2026-04-11T10:24:00Z',
    type: 'expense'
  },
  {
    id: '2',
    merchant: 'Salary',
    amount: 2700.00,
    category: 'Salary',
    date: '2026-04-11T09:00:00Z',
    type: 'income'
  },
  {
    id: '3',
    merchant: 'Shell',
    amount: 65.00,
    category: 'Transport',
    date: '2026-04-10T15:30:00Z',
    type: 'expense'
  },
  {
    id: '4',
    merchant: 'Apple Store',
    amount: 1299.00,
    category: 'Shopping',
    date: '2026-04-09T11:20:00Z',
    type: 'expense'
  },
  {
    id: '5',
    merchant: 'The Green Bistro',
    amount: 42.50,
    category: 'Dining & Drinks',
    date: '2026-04-08T19:45:00Z',
    type: 'expense'
  },
  {
    id: '6',
    merchant: 'Uber Ride',
    amount: 24.80,
    category: 'Transport',
    date: '2026-04-08T08:15:00Z',
    type: 'expense'
  },
  {
    id: '7',
    merchant: 'Netflix',
    amount: 19.99,
    category: 'Subscriptions',
    date: '2026-04-07T00:00:00Z',
    type: 'expense'
  }
];

export const MOCK_BUDGETS: Budget[] = [
  {
    category: 'Dining & Drinks',
    spent: 240,
    limit: 500,
    status: 'Healthy'
  },
  {
    category: 'Shopping',
    spent: 680,
    limit: 850,
    status: 'Watch out'
  },
  {
    category: 'Subscriptions',
    spent: 142.50,
    limit: 150,
    status: 'Near limit'
  }
];

export const MOCK_GOALS: Goal[] = [
  {
    id: '1',
    name: 'Home Deposit',
    category: 'Property',
    current: 45000,
    target: 120000,
    daysLeft: 312
  },
  {
    id: '2',
    name: 'Japan Trip',
    category: 'Travel',
    current: 3200,
    target: 4500,
    daysLeft: 42
  }
];

export const MOCK_WEEKLY_INSIGHT: WeeklyInsight = {
  savingsRate: 24.5,
  vsGoal: 4.2,
  summary:
    'Your spending this week is 12% lower than your typical average. Major savings were found in Dining & Drinks, while your subscription audit successfully removed three dormant services, resulting in $45 monthly savings.',
  topCategories: [
    { category: 'Retail & Fashion', amount: 428.5, change: 12.4 },
    { category: 'Dining & Drinks', amount: 185.2, change: -8.1 },
    { category: 'Transport', amount: 92.00, change: 0 }
  ],
  anomalies: [
    {
      title: 'Double Charge?',
      description: "Two identical charges of $45.00 found at 'City Gym' within 4 minutes."
    },
    {
      title: 'Unusual Utility Hike',
      description: "Electricity bill is 35% higher than usual for April. Check for AC leaks."
    }
  ],
  tips: [
    {
      title: 'Switch Grocery Day',
      description: "Shopping on Tuesdays could save you ~8% based on local price trends."
    },
    {
      title: 'Bundle Insurance',
      description: "Merging home and auto under one provider could yield $220/yr in credits."
    },
    {
      title: 'Audit Subscriptions',
      description: "You haven't opened the 'MusicMaster' app in 60 days. Consider canceling."
    }
  ]
};
