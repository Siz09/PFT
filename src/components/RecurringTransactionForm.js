import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { categories, incomeCategories } from '../data/categories';
import Button from './core/Button';

const RecurringTransactionForm = ({ recurringTransaction, onClose }) => {
  const { addRecurringTransaction, updateRecurringTransaction } = useFinance();
  const [formData, setFormData] = useState({
    type: recurringTransaction?.type || 'expense',
    amount: recurringTransaction?.amount || '',
    category: recurringTransaction?.category || '',
    description: recurringTransaction?.description || '',
    frequency: recurringTransaction?.frequency || 'monthly',
    nextDate: recurringTransaction?.nextDate ? 
      new Date(recurringTransaction.nextDate).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0],
    tags: recurringTransaction?.tags?.join(', ') || '',
    isActive: recurringTransaction?.isActive !== undefined ? recurringTransaction.isActive : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.description) {
      return;
    }

    const recurringData = {
      ...formData,
      amount: parseFloat(formData.amount),
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      nextDate: new Date(formData.nextDate)
    };

    if (recurringTransaction) {
      updateRecurringTransaction(recurringTransaction.id, recurringData);
    } else {
      addRecurringTransaction(recurringData);
    }
    
    onClose();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // Reset category when type changes
      ...(name === 'type' && { category: '' })
    }));
  };

  const availableCategories = formData.type === 'income' ? incomeCategories : categories;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Type
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="type"
              value="income"
              checked={formData.type === 'income'}
              onChange={handleChange}
              className="mr-2 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Income</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="type"
              value="expense"
              checked={formData.type === 'expense'}
              onChange={handleChange}
              className="mr-2 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Expense</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Frequency
          </label>
          <select
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          placeholder="Enter description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
        >
          <option value="">Select a category</option>
          {availableCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Next Date
        </label>
        <input
          type="date"
          name="nextDate"
          value={formData.nextDate}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags (optional)
        </label>
        <input
          type="text"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          placeholder="work, personal, urgent (comma separated)"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="mr-2 text-primary focus:ring-primary"
        />
        <label className="text-sm text-gray-700 dark:text-gray-300">
          Active (will create transactions automatically)
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {recurringTransaction ? 'Update' : 'Create'} Recurring Transaction
        </Button>
      </div>
    </form>
  );
};

export default RecurringTransactionForm;