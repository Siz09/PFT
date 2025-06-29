import React, { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import SummaryCard from '../components/SummaryCard';
import ChartTypeSelector from '../components/ChartTypeSelector';
import Modal from '../components/core/Modal';
import TransactionForm from '../components/TransactionForm';
import Button from '../components/core/Button';
import Card from '../components/core/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

// Lazy load charts for better performance
const CustomPieChart = lazy(() => import('../components/charts/PieChart'));
const CustomBarChart = lazy(() => import('../components/charts/BarChart'));
const CustomLineChart = lazy(() => import('../components/charts/LineChart'));

const Dashboard = () => {
  const { transactions, getFinancialSummary, loading } = useFinance();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [chartType, setChartType] = useState('bar');
  const { income, expenses, balance } = getFinancialSummary();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      keys: 'ctrl+n',
      action: () => setShowTransactionModal(true)
    }
  ]);

  // Get recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  // Prepare data for charts
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieChartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value
  }));

  // Monthly data for charts (calculated from actual transactions)
  const getMonthlyData = () => {
    const monthlyData = {};
    const currentYear = new Date().getFullYear();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      monthlyData[monthKey] = { name: monthKey, income: 0, expense: 0 };
    }

    // Calculate actual data from transactions
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate.getFullYear() === currentYear) {
        const monthKey = transactionDate.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyData[monthKey]) {
          if (transaction.type === 'income') {
            monthlyData[monthKey].income += transaction.amount;
          } else {
            monthlyData[monthKey].expense += transaction.amount;
          }
        }
      }
    });

    return Object.values(monthlyData);
  };

  const chartTypes = [
    {
      value: 'bar',
      label: 'Bar',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      value: 'line',
      label: 'Line',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    }
  ];

  const renderChart = () => {
    const monthlyData = getMonthlyData();
    
    switch (chartType) {
      case 'line':
        return <CustomLineChart data={monthlyData} title="Monthly Income vs Expenses" />;
      default:
        return <CustomBarChart data={monthlyData} title="Monthly Income vs Expenses" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's your financial overview.
            <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              Press Ctrl+N to add transaction
            </span>
          </p>
        </div>
        <Button onClick={() => setShowTransactionModal(true)}>
          Add Transaction
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Total Income"
          amount={income}
          color="text-green-600"
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          }
        />
        <SummaryCard
          title="Total Expenses"
          amount={expenses}
          color="text-red-600"
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          }
        />
        <SummaryCard
          title="Balance"
          amount={balance}
          color={balance >= 0 ? "text-blue-600" : "text-red-600"}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          {pieChartData.length > 0 ? (
            <Suspense fallback={<LoadingSpinner className="h-80" />}>
              <CustomPieChart data={pieChartData} title="Expenses by Category" />
            </Suspense>
          ) : (
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              title="No expense data"
              description="Add some transactions to see your spending breakdown"
              actionLabel="Add Transaction"
              onAction={() => setShowTransactionModal(true)}
            />
          )}
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Monthly Income vs Expenses
              </h3>
              <ChartTypeSelector
                activeType={chartType}
                onTypeChange={setChartType}
                types={chartTypes}
              />
            </div>
            <Suspense fallback={<LoadingSpinner className="h-64" />}>
              {renderChart()}
            </Suspense>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      {transaction.type === 'income' ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
                title="No transactions yet"
                description="Add your first transaction to get started"
                actionLabel="Add Transaction"
                onAction={() => setShowTransactionModal(true)}
              />
            )}
          </div>
        </Card>
      </motion.div>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        title="Add New Transaction"
      >
        <TransactionForm onClose={() => setShowTransactionModal(false)} />
      </Modal>
    </motion.div>
  );
};

export default Dashboard;