import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockTransactions, mockBudgets } from '../data/mockData';
import { toast } from 'react-toastify';

const FinanceContext = createContext();

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : mockTransactions;
  });

  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('budgets');
    return saved ? JSON.parse(saved) : mockBudgets;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets));
  }, [budgets]);

  const login = (email, password) => {
    // Mock authentication
    if (email && password) {
      const userData = {
        id: 1,
        name: email.split('@')[0],
        email: email
      };
      setUser(userData);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return true;
    }
    toast.error('Invalid credentials');
    return false;
  };

  const register = (name, email, password) => {
    // Mock registration
    if (name && email && password) {
      const userData = {
        id: 1,
        name: name,
        email: email
      };
      setUser(userData);
      setIsAuthenticated(true);
      toast.success('Registration successful!');
      return true;
    }
    toast.error('Please fill all fields');
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.clear();
    toast.success('Logged out successfully');
  };

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
    isAuthenticated,
    user,
    transactions,
    budgets: calculateBudgetSpending(),
    login,
    register,
    logout,
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