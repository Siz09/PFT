import React from 'react';
import { motion } from 'framer-motion';
import Card from './core/Card';

const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const percentage = (budget.spent / budget.amount) * 100;
  const isOverBudget = percentage > 100;

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (percentage > 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card hover className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {budget.category}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(budget)}
            className="text-gray-400 hover:text-primary transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="text-gray-400 hover:text-red-500 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Spent</span>
          <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
            ${budget.spent.toLocaleString()} / ${budget.amount.toLocaleString()}
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-2 rounded-full ${getProgressColor()}`}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`}>
            {percentage.toFixed(1)}% used
          </span>
          {isOverBudget && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              Over Budget
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BudgetCard;