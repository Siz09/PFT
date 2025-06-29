import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import Card from '../components/core/Card';
import Button from '../components/core/Button';

const Settings = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useFinance();

  const handleExportData = () => {
    // Mock export functionality
    const data = {
      transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
      budgets: JSON.parse(localStorage.getItem('budgets') || '[]')
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'smartspend-data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem('transactions');
      localStorage.removeItem('budgets');
      window.location.reload();
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account and application preferences</p>
      </motion.div>

      {/* Profile Settings */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={user?.name || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Profile editing is not available in demo mode.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Appearance Settings */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Toggle between light and dark themes
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isDark ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDark ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Notifications Settings */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Budget Alerts</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get notified when you exceed your budget
                </p>
              </div>
              <button
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                disabled
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Transaction Reminders</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Remind me to log my transactions
                </p>
              </div>
              <button
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                disabled
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Notification settings are not available in demo mode.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Data Management */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Management</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Download your transactions and budgets as JSON
                </p>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Clear All Data</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Remove all transactions and budgets
                </p>
              </div>
              <Button variant="danger" onClick={handleClearData}>
                Clear Data
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Account Actions */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Sign Out</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sign out of your SmartSpend account
              </p>
            </div>
            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* App Info */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About SmartSpend</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Version: 1.0.0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              SmartSpend is a personal finance tracker designed for students and young professionals.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Built with React, Tailwind CSS, and modern web technologies.
            </p>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Settings;