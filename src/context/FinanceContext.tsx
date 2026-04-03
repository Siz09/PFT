import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase-config';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { Transaction, Budget, Goal, RecurringTransaction, Category, FinancialSummary } from '../types';

interface FinanceContextValue {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  categories: Category[];
  recurringTransactions: RecurringTransaction[];
  loading: boolean;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (data: Omit<Budget, 'id' | 'spent' | 'createdAt' | 'userId'>) => Promise<void>;
  updateBudget: (id: string, data: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addGoal: (data: Omit<Goal, 'id' | 'currentAmount' | 'createdAt' | 'userId'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addCategory: (data: Omit<Category, 'id' | 'userId'>) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addRecurringTransaction: (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateRecurringTransaction: (id: string, data: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  getFinancialSummary: () => FinancialSummary;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export const useFinance = (): FinanceContextValue => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

interface FinanceProviderProps {
  children: React.ReactNode;
}

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
      setCategories([]);
      setRecurringTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const transactionsQuery = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeTransactions = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const transactionsList: Transaction[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Transaction, 'id' | 'createdAt' | 'date'>),
          date: (docSnap.data().date as string) || new Date().toISOString().split('T')[0],
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date()
        }));
        setTransactions(transactionsList);
      },
      (error) => {
        console.error('Error fetching transactions:', error);
        toast.error('Failed to load transactions');
      }
    );

    const budgetsQuery = query(
      collection(db, 'users', user.uid, 'budgets'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeBudgets = onSnapshot(
      budgetsQuery,
      (snapshot) => {
        const budgetsList: Budget[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Budget, 'id' | 'createdAt'>),
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date()
        }));
        setBudgets(budgetsList);
      },
      (error) => {
        console.error('Error fetching budgets:', error);
        toast.error('Failed to load budgets');
      }
    );

    const goalsQuery = query(
      collection(db, 'users', user.uid, 'goals'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeGoals = onSnapshot(
      goalsQuery,
      (snapshot) => {
        const goalsList: Goal[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Goal, 'id' | 'createdAt' | 'deadline'>),
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
          deadline: (docSnap.data().deadline as string | null | undefined) || null
        }));
        setGoals(goalsList);
      },
      (error) => {
        console.error('Error fetching goals:', error);
        toast.error('Failed to load goals');
      }
    );

    const categoriesQuery = query(
      collection(db, 'users', user.uid, 'categories'),
      orderBy('name')
    );

    const unsubscribeCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const categoriesList: Category[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Category, 'id'>)
        }));
        setCategories(categoriesList);
      },
      (error) => {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    );

    const recurringQuery = query(
      collection(db, 'users', user.uid, 'recurringTransactions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeRecurring = onSnapshot(
      recurringQuery,
      (snapshot) => {
        const recurringList: RecurringTransaction[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<RecurringTransaction, 'id' | 'createdAt' | 'nextDate'>),
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
          nextDate: docSnap.data().nextDate?.toDate?.() || new Date()
        }));
        setRecurringTransactions(recurringList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching recurring transactions:', error);
        toast.error('Failed to load recurring transactions');
        setLoading(false);
      }
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeBudgets();
      unsubscribeGoals();
      unsubscribeCategories();
      unsubscribeRecurring();
    };
  }, [user]);

  const addTransaction = async (
    transactionData: Omit<Transaction, 'id' | 'createdAt' | 'userId'>
  ): Promise<void> => {
    if (!user) {
      toast.error('Please log in to add transactions');
      return;
    }

    try {
      const tempId = Date.now().toString();
      const optimisticTransaction: Transaction = {
        id: tempId,
        ...transactionData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setTransactions((prev) => [optimisticTransaction, ...prev]);

      const docData = {
        ...transactionData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'transactions'), docData);

      setTransactions((prev) =>
        prev.map((t) => (t.id === tempId ? { ...t, id: docRef.id } : t))
      );

      toast.success('Transaction added successfully!');
    } catch (error: unknown) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  const updateTransaction = async (id: string, updatedData: Partial<Transaction>): Promise<void> => {
    if (!user) {
      toast.error('Please log in to update transactions');
      return;
    }

    try {
      const transactionRef = doc(db, 'users', user.uid, 'transactions', id);
      await updateDoc(transactionRef, {
        ...updatedData,
        updatedAt: serverTimestamp()
      });
      toast.success('Transaction updated successfully!');
    } catch (error: unknown) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    if (!user) {
      toast.error('Please log in to delete transactions');
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
      toast.success('Transaction deleted successfully!');
    } catch (error: unknown) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const addBudget = async (
    budgetData: Omit<Budget, 'id' | 'spent' | 'createdAt' | 'userId'>
  ): Promise<void> => {
    if (!user) {
      toast.error('Please log in to add budgets');
      return;
    }

    try {
      const docData = {
        ...budgetData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'users', user.uid, 'budgets'), docData);
      toast.success('Budget added successfully!');
    } catch (error: unknown) {
      console.error('Error adding budget:', error);
      toast.error('Failed to add budget');
    }
  };

  const updateBudget = async (id: string, updatedData: Partial<Budget>): Promise<void> => {
    if (!user) {
      toast.error('Please log in to update budgets');
      return;
    }

    try {
      const budgetRef = doc(db, 'users', user.uid, 'budgets', id);
      await updateDoc(budgetRef, {
        ...updatedData,
        updatedAt: serverTimestamp()
      });
      toast.success('Budget updated successfully!');
    } catch (error: unknown) {
      console.error('Error updating budget:', error);
      toast.error('Failed to update budget');
    }
  };

  const deleteBudget = async (id: string): Promise<void> => {
    if (!user) {
      toast.error('Please log in to delete budgets');
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'budgets', id));
      toast.success('Budget deleted successfully!');
    } catch (error: unknown) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };

  const addGoal = async (
    goalData: Omit<Goal, 'id' | 'currentAmount' | 'createdAt' | 'userId'>
  ): Promise<void> => {
    if (!user) {
      toast.error('Please log in to add goals');
      return;
    }

    try {
      const docData = {
        ...goalData,
        userId: user.uid,
        currentAmount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'users', user.uid, 'goals'), docData);
      toast.success('Goal added successfully!');
    } catch (error: unknown) {
      console.error('Error adding goal:', error);
      toast.error('Failed to add goal');
    }
  };

  const updateGoal = async (id: string, updatedData: Partial<Goal>): Promise<void> => {
    if (!user) {
      toast.error('Please log in to update goals');
      return;
    }

    try {
      const goalRef = doc(db, 'users', user.uid, 'goals', id);
      await updateDoc(goalRef, {
        ...updatedData,
        updatedAt: serverTimestamp()
      });
      toast.success('Goal updated successfully!');
    } catch (error: unknown) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
  };

  const deleteGoal = async (id: string): Promise<void> => {
    if (!user) {
      toast.error('Please log in to delete goals');
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'goals', id));
      toast.success('Goal deleted successfully!');
    } catch (error: unknown) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id' | 'userId'>): Promise<void> => {
    if (!user) {
      toast.error('Please log in to add categories');
      return;
    }

    try {
      const docData = {
        ...categoryData,
        userId: user.uid,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'users', user.uid, 'categories'), docData);
      toast.success('Category added successfully!');
    } catch (error: unknown) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

  const updateCategory = async (id: string, updatedData: Partial<Category>): Promise<void> => {
    if (!user) {
      toast.error('Please log in to update categories');
      return;
    }

    try {
      const categoryRef = doc(db, 'users', user.uid, 'categories', id);
      await updateDoc(categoryRef, updatedData);
      toast.success('Category updated successfully!');
    } catch (error: unknown) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    if (!user) {
      toast.error('Please log in to delete categories');
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'categories', id));
      toast.success('Category deleted successfully!');
    } catch (error: unknown) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const addRecurringTransaction = async (
    recurringData: Omit<RecurringTransaction, 'id' | 'createdAt' | 'userId'>
  ): Promise<void> => {
    if (!user) {
      toast.error('Please log in to add recurring transactions');
      return;
    }

    try {
      const docData = {
        ...recurringData,
        userId: user.uid,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'users', user.uid, 'recurringTransactions'), docData);
      toast.success('Recurring transaction added successfully!');
    } catch (error: unknown) {
      console.error('Error adding recurring transaction:', error);
      toast.error('Failed to add recurring transaction');
    }
  };

  const updateRecurringTransaction = async (
    id: string,
    updatedData: Partial<RecurringTransaction>
  ): Promise<void> => {
    if (!user) {
      toast.error('Please log in to update recurring transactions');
      return;
    }

    try {
      const recurringRef = doc(db, 'users', user.uid, 'recurringTransactions', id);
      await updateDoc(recurringRef, {
        ...updatedData,
        updatedAt: serverTimestamp()
      });
      toast.success('Recurring transaction updated successfully!');
    } catch (error: unknown) {
      console.error('Error updating recurring transaction:', error);
      toast.error('Failed to update recurring transaction');
    }
  };

  const deleteRecurringTransaction = async (id: string): Promise<void> => {
    if (!user) {
      toast.error('Please log in to delete recurring transactions');
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'recurringTransactions', id));
      toast.success('Recurring transaction deleted successfully!');
    } catch (error: unknown) {
      console.error('Error deleting recurring transaction:', error);
      toast.error('Failed to delete recurring transaction');
    }
  };

  const getFinancialSummary = (): FinancialSummary => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    const income = monthlyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    return { income, expenses, balance };
  };

  const calculateBudgetSpending = (): Budget[] => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return budgets.map((budget) => {
      const spent = transactions
        .filter((t) => {
          const transactionDate = new Date(t.date);
          return (
            t.type === 'expense' &&
            t.category === budget.category &&
            transactionDate.getMonth() === currentMonth &&
            transactionDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);

      return { ...budget, spent };
    });
  };

  const processRecurringTransactions = async (): Promise<void> => {
    if (!user) return;

    const today = new Date();
    const batch = writeBatch(db);

    for (const recurring of recurringTransactions) {
      if (recurring.isActive && recurring.nextDate <= today) {
        const transactionRef = doc(collection(db, 'users', user.uid, 'transactions'));
        batch.set(transactionRef, {
          type: recurring.type,
          amount: recurring.amount,
          category: recurring.category,
          description: recurring.description,
          date: today.toISOString().split('T')[0],
          tags: recurring.tags || [],
          notes: `Recurring: ${recurring.description}`,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        const nextDate = new Date(recurring.nextDate);
        switch (recurring.frequency) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        const recurringRef = doc(db, 'users', user.uid, 'recurringTransactions', recurring.id);
        batch.update(recurringRef, {
          nextDate: nextDate,
          lastProcessed: serverTimestamp()
        });
      }
    }

    try {
      await batch.commit();
      console.log('Recurring transactions processed');
    } catch (error: unknown) {
      console.error('Error processing recurring transactions:', error);
    }
  };

  useEffect(() => {
    if (user && recurringTransactions.length > 0) {
      processRecurringTransactions();

      const interval = setInterval(processRecurringTransactions, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, recurringTransactions]);

  const value: FinanceContextValue = {
    transactions,
    budgets: calculateBudgetSpending(),
    goals,
    categories,
    recurringTransactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    addCategory,
    updateCategory,
    deleteCategory,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    getFinancialSummary
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};
