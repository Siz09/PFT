import React, { useState, useMemo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import Card from '../components/core/Card';
import Button from '../components/core/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { Transaction, ChartDataPoint, MonthlyDataPoint } from '../types';

const CustomPieChart = lazy(() => import('../components/charts/PieChart'));
const CustomBarChart = lazy(() => import('../components/charts/BarChart'));

type Period = 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface ReportSummary {
  income: number;
  expenses: number;
  balance: number;
  transactionCount: number;
  avgTransaction: number;
  topCategory: { name: string; amount: number } | null;
}

const Reports: React.FC = () => {
  const { transactions, loading } = useFinance();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('thisMonth');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const getDateRange = (period: Period): DateRange => {
    const now = new Date();

    switch (period) {
      case 'thisMonth':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
      case 'lastMonth':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          endDate: new Date(now.getFullYear(), now.getMonth(), 0)
        };
      case 'thisYear':
        return {
          startDate: new Date(selectedYear, 0, 1),
          endDate: new Date(selectedYear, 11, 31)
        };
      case 'lastYear':
        return {
          startDate: new Date(selectedYear - 1, 0, 1),
          endDate: new Date(selectedYear - 1, 11, 31)
        };
      default:
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
    }
  };

  const filteredTransactions = useMemo((): Transaction[] => {
    const { startDate, endDate } = getDateRange(selectedPeriod);
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, selectedPeriod, selectedYear]);

  const summary = useMemo((): ReportSummary => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;
    const transactionCount = filteredTransactions.length;
    const avgTransaction =
      transactionCount > 0
        ? filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / transactionCount
        : 0;

    const categoryTotals: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0];

    return {
      income,
      expenses,
      balance,
      transactionCount,
      avgTransaction,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null
    };
  }, [filteredTransactions]);

  const expensesByCategory = useMemo((): ChartDataPoint[] => {
    const categoryTotals: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const monthlyData = useMemo((): MonthlyDataPoint[] => {
    if (selectedPeriod === 'thisYear' || selectedPeriod === 'lastYear') {
      const monthlyTotals: Record<string, MonthlyDataPoint> = {};
      const year = selectedPeriod === 'lastYear' ? selectedYear - 1 : selectedYear;

      for (let i = 0; i < 12; i++) {
        const monthName = new Date(year, i).toLocaleDateString('en-US', { month: 'short' });
        monthlyTotals[monthName] = { name: monthName, income: 0, expense: 0 };
      }

      filteredTransactions.forEach((transaction) => {
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
      const dailyTotals: Record<string, MonthlyDataPoint> = {};
      const { startDate, endDate } = getDateRange(selectedPeriod);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayName = d.getDate().toString();
        dailyTotals[dayName] = { name: dayName, income: 0, expense: 0 };
      }

      filteredTransactions.forEach((transaction) => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTransactions, selectedPeriod, selectedYear]);

  const exportToCSV = (): void => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Tags'];
    const csvData = [
      headers.join(','),
      ...filteredTransactions.map((t) =>
        [
          t.date,
          t.type,
          t.category,
          `"${t.description}"`,
          t.amount,
          `"${(t.tags || []).join(', ')}"`
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartspend-report-${selectedPeriod}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = (): void => {
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
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
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
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze your financial data and trends
          </p>
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

      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as Period)}
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
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
                    (year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { label: 'Total Income', value: `$${summary.income.toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900' },
          { label: 'Total Expenses', value: `$${summary.expenses.toLocaleString()}`, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900' },
          { label: 'Net Balance', value: `$${summary.balance.toLocaleString()}`, color: summary.balance >= 0 ? 'text-blue-600' : 'text-red-600', bg: summary.balance >= 0 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-red-100 dark:bg-red-900' },
          { label: 'Transactions', value: summary.transactionCount, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900', sub: `Avg: $${summary.avgTransaction.toFixed(0)}` }
        ].map(({ label, value, color, bg, sub }) => (
          <Card key={label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                {sub && <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
              </div>
              <div className={`p-3 rounded-full ${bg}`} />
            </div>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          {expensesByCategory.length > 0 ? (
            <Suspense fallback={<LoadingSpinner className="h-80" />}>
              <CustomPieChart data={expensesByCategory} title="Expenses by Category" />
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

      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Detailed Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Top Spending Categories
              </h4>
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
                  • Average transaction amount:{' '}
                  <strong>${summary.avgTransaction.toFixed(2)}</strong>
                </p>
                {summary.topCategory && (
                  <p>
                    • Highest spending category:{' '}
                    <strong>{summary.topCategory.name}</strong> ($
                    {summary.topCategory.amount.toLocaleString()})
                  </p>
                )}
                <p>
                  • Savings rate:{' '}
                  <strong>
                    {summary.income > 0
                      ? ((summary.balance / summary.income) * 100).toFixed(1)
                      : 0}
                    %
                  </strong>
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
