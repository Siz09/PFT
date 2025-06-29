import React, { useState, useMemo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import Card from '../components/core/Card';
import Button from '../components/core/Button';
import LoadingSpinner from '../components/LoadingSpinner';

// Lazy load charts
const CustomPieChart = lazy(() => import('../components/charts/PieChart'));
const CustomBarChart = lazy(() => import('../components/charts/BarChart'));
const CustomLineChart = lazy(() => import('../components/charts/LineChart'));

const Reports = () => {
  const { transactions, budgets, loading } = useFinance();
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Calculate date ranges
  const getDateRange = (period) => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31);
        break;
      case 'lastYear':
        startDate = new Date(selectedYear - 1, 0, 1);
        endDate = new Date(selectedYear - 1, 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { startDate, endDate };
  };

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    const { startDate, endDate } = getDateRange(selectedPeriod);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }, [transactions, selectedPeriod, selectedYear]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;
    const transactionCount = filteredTransactions.length;

    // Calculate average transaction amount
    const avgTransaction = transactionCount > 0 ? 
      filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / transactionCount : 0;

    // Calculate top categories
    const categoryTotals = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      income,
      expenses,
      balance,
      transactionCount,
      avgTransaction,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null
    };
  }, [filteredTransactions]);

  // Prepare chart data
  const expensesByCategory = useMemo(() => {
    const categoryTotals = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const monthlyData = useMemo(() => {
    if (selectedPeriod === 'thisYear' || selectedPeriod === 'lastYear') {
      const monthlyTotals = {};
      
      // Initialize all months
      for (let i = 0; i < 12; i++) {
        const monthName = new Date(selectedYear, i).toLocaleDateString('en-US', { month: 'short' });
        monthlyTotals[monthName] = { name: monthName, income: 0, expense: 0 };
      }

      // Calculate actual data
      filteredTransactions.forEach(transaction => {
        const monthName = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short' });
        if (monthlyTotals[monthName]) {
          if (transaction.type === 'income') {
            monthlyTotals[monthName].income += transaction.amount;
          } else {
            monthlyTotals[monthName].expense += transaction.amount;
          }
        }
      });

      return Object.values(monthlyTotals);
    } else {
      // For monthly reports, show daily data
      const dailyTotals = {};
      const { startDate, endDate } = getDateRange(selectedPeriod);
      
      // Initialize all days in the month
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayName = d.getDate().toString();
        dailyTotals[dayName] = { name: dayName, income: 0, expense: 0 };
      }

      // Calculate actual data
      filteredTransactions.forEach(transaction => {
        const dayName = new Date(transaction.date).getDate().toString();
        if (dailyTotals[dayName]) {
          if (transaction.type === 'income') {
            dailyTotals[dayName].income += transaction.amount;
          } else {
            dailyTotals[dayName].expense += transaction.amount;
          }
        }
      });

      return Object.values(dailyTotals);
    }
  }, [filteredTransactions, selectedPeriod, selectedYear]);

  // Export data as CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Tags'];
    const csvData = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.date,
        t.type,
        t.category,
        `"${t.description}"`,
        t.amount,
        `"${(t.tags || []).join(', ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartspend-report-${selectedPeriod}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export data as JSON
  const exportToJSON = () => {
    const data = {
      period: selectedPeriod,
      year: selectedYear,
      summary,
      transactions: filteredTransactions,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartspend-report-${selectedPeriod}-${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
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
        <LoadingSpinner size="lg" text="Loading reports..." />
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Analyze your financial data and trends</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportToCSV}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportToJSON}>
            Export JSON
          </Button>
        </div>
      </motion.div>

      {/* Period Selector */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              >
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
                <option value="lastYear">Last Year</option>
              </select>
            </div>
            
            {(selectedPeriod === 'thisYear' || selectedPeriod === 'lastYear') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
              <p className="text-2xl font-bold text-green-600">${summary.income.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">${summary.expenses.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Balance</p>
              <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ${summary.balance.toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-full ${summary.balance >= 0 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-red-100 dark:bg-red-900'}`}>
              <svg className={`w-6 h-6 ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions</p>
              <p className="text-2xl font-bold text-purple-600">{summary.transactionCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Avg: ${summary.avgTransaction.toFixed(0)}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          {expensesByCategory.length > 0 ? (
            <Suspense fallback={<LoadingSpinner className="h-80" />}>
              <CustomPieChart 
                data={expensesByCategory} 
                title="Expenses by Category" 
              />
            </Suspense>
          ) : (
            <Card className="p-6 h-80 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">No expense data for this period</p>
            </Card>
          )}
        </motion.div>

        <motion.div variants={itemVariants}>
          <Suspense fallback={<LoadingSpinner className="h-80" />}>
            <CustomBarChart 
              data={monthlyData} 
              title={selectedPeriod.includes('Year') ? 'Monthly Trends' : 'Daily Trends'} 
            />
          </Suspense>
        </motion.div>
      </div>

      {/* Detailed Analysis */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Detailed Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Top Spending Categories</h4>
              <div className="space-y-2">
                {expensesByCategory.slice(0, 5).map((category, index) => (
                  <div key={category.name} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {index + 1}. {category.name}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${category.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Key Insights</h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  • Average transaction amount: <strong>${summary.avgTransaction.toFixed(2)}</strong>
                </p>
                {summary.topCategory && (
                  <p>
                    • Highest spending category: <strong>{summary.topCategory.name}</strong> (${summary.topCategory.amount.toLocaleString()})
                  </p>
                )}
                <p>
                  • Savings rate: <strong>{summary.income > 0 ? ((summary.balance / summary.income) * 100).toFixed(1) : 0}%</strong>
                </p>
                <p>
                  • Total transactions: <strong>{summary.transactionCount}</strong>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Reports;