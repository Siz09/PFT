import React from 'react';
import { motion } from 'framer-motion';
import Card from './core/Card';

const GoalCard = ({ goal, onEdit, onDelete, onAddProgress }) => {
  const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const isCompleted = goal.currentAmount >= goal.targetAmount;
  const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const getProgressColor = () => {
    if (isCompleted) return 'bg-green-500';
    if (percentage > 75) return 'bg-blue-500';
    if (percentage > 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <Card hover className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {goal.name}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onAddProgress(goal)}
            className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
            title="Add Progress"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button
            onClick={() => onEdit(goal)}
            className="text-gray-400 hover:text-primary transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="text-gray-400 hover:text-red-500 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {goal.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {goal.description}
        </p>
      )}

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
            ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-3 rounded-full ${getProgressColor()}`}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`}>
            {percentage.toFixed(1)}% complete
          </span>
          {isCompleted && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Goal Achieved! 🎉
            </span>
          )}
        </div>

        {daysLeft !== null && !isCompleted && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {daysLeft > 0 ? (
              <span>{daysLeft} days remaining</span>
            ) : daysLeft === 0 ? (
              <span className="text-orange-600">Due today!</span>
            ) : (
              <span className="text-red-600">{Math.abs(daysLeft)} days overdue</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default GoalCard;