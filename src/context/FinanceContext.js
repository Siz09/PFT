import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase-config';
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
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time listeners for user data
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setBudgets([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Set up real-time listener for transactions
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(transactionsList);
    }, (error) => {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    });

    // Set up real-time listener for budgets
    const budgetsQuery = query(
      collection(db, 'budgets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeBudgets = onSnapshot(budgetsQuery, (snapshot) => {
      const budgetsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBudgets(budgetsList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching budgets:', error);
      toast.error('Failed to load budgets');
      setLoading(false);
    });

    // Cleanup listeners
    return () => {
      unsubscribeTransactions();
      unsubscribeBudgets();
    };
  }, [user]);

  // Transaction functions
  const addTransaction = async (transactionData) => {
    if (!user) {
      toast.error('Please log in to add transactions');
      return;
    }

    try {
      const docData = {
        ...transactionData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'transactions'), docData);
      toast.success('Transaction added successfully!');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  const updateTransaction = async (id, updatedData) => {
    if (!user) {
      toast.error('Please log in to update transactions');
      return;
    }

    try {
      const transactionRef = doc(db, 'transactions', id);
      await updateDoc(transactionRef, {
        ...updatedData,
        updatedAt: new Date()
      });
      toast.success('Transaction updated successfully!');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    }
  };

  const deleteTransaction = async (id) => {
    if (!user) {
      toast.error('Please log in to delete transactions');
      return;
    }

    try {
      await deleteDoc(doc(db, 'transactions', id));
      toast.success('Transaction deleted successfully!');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  // Budget functions
  const addBudget = async (budgetData) => {
    if (!user) {
      toast.error('Please log in to add budgets');
      return;
    }

    try {
      const docData = {
        ...budgetData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'budgets'), docData);
      toast.success('Budget added successfully!');
    } catch (error) {
      console.error('Error adding budget:', error);
      toast.error('Failed to add budget');
    }
  };

  const updateBudget = async (id, updatedData) => {
    if (!user) {
      toast.error('Please log in to update budgets');
      return;
    }

    try {
      const budgetRef = doc(db, 'budgets', id);
      await updateDoc(budgetRef, {
        ...updatedData,
        updatedAt: new Date()
      });
      toast.success('Budget updated successfully!');
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
    }
  };

  const deleteBudget = async (id) => {
    if (!user) {
      toast.error('Please log in to delete budgets');
      return;
    }

    try {
      await deleteDoc(doc(db, 'budgets', id));
      toast.success('Budget deleted successfully!');
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
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

  // Calculate budget spending with real-time data
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
    loading,
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