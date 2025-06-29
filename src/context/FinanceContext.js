import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockTransactions, mockBudgets } from '../data/mockData';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const FinanceContext = createContext();

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [transactions, setTransactions] = useState(() => {
    if (!user) return [];
    const saved = localStorage.getItem(`transactions_${user.uid}`);
    return saved ? JSON.parse(saved) : mockTransactions;
  });

  const [budgets, setBudgets] = useState(() => {
    if (!user) return [];
    const saved = localStorage.getItem(`budgets_${user.uid}`);
    return saved ? JSON.parse(saved) : mockBudgets;
  });

  // Save to localStorage whenever state changes (user-specific)
  useEffect(() => {
    if (user) {
      localStorage.setItem(`transactions_${user.uid}`, JSON.stringify(transactions));
    }
  }, [transactions, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`budgets_${user.uid}`, JSON.stringify(budgets));
    }
  }, [budgets, user]);

  // Load user-specific data when user changes
  useEffect(() => {
    if (user) {
      const savedTransactions = localStorage.getItem(`transactions_${user.uid}`);
      const savedBudgets = localStorage.getItem(`budgets_${user.uid}`);
      
      setTransactions(savedTransactions ? JSON.parse(savedTransactions) : mockTransactions);
      setBudgets(savedBudgets ? JSON.parse(savedBudgets) : mockBudgets);
    } else {
      setTransactions([]);
      setBudgets([]);
    }
  }, [user]);

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    setTransactions(prev => [newTransaction, ...prev]);
    toast.success('Transaction added successfully!');
  };

  const updateTransaction = (id, updatedTransaction) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, ...updatedTransaction } : t)
    );
    toast.success('Transaction updated successfully!');
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success('Transaction deleted successfully!');
  };

  const addBudget = (budget) => {
    const newBudget = {
      ...budget,
      id: Date.now(),
      spent: 0
    };
    setBudgets(prev => [...prev, newBudget]);
    toast.success('Budget added successfully!');
  };

  const updateBudget = (id, updatedBudget) => {
    setBudgets(prev => 
      prev.map(b => b.id === id ? { ...b, ...updatedBudget } : b)
    );
    toast.success('Budget updated successfully!');
  };

  const deleteBudget = (id) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    toast.success('Budget deleted successfully!');
  };

  // Calculate financial summary
  const getFinancialSummary = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    return { income, expenses, balance };
  };

  // Calculate budget spending
  const calculateBudgetSpending = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.type === 'expense' && 
                 t.category === budget.category &&
                 transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      return { ...budget, spent };
    });
  };

  const value = {
    transactions,
    budgets: calculateBudgetSpending(),
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    getFinancialSummary
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};