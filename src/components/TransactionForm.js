import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { categories, incomeCategories } from '../data/categories';
import Button from './core/Button';

const TransactionForm = ({ transaction, onClose }) => {
  const { addTransaction, updateTransaction } = useFinance();
  const [formData, setFormData] = useState({
    type: transaction?.type || 'expense',
    amount: transaction?.amount || '',
    category: transaction?.category || '',
    description: transaction?.description || '',
    date: transaction?.date || new Date().toISOString().split('T')[0],
    tags: transaction?.tags || '',
    notes: transaction?.notes || ''
  });

  // Auto-suggest categories based on description
  const [suggestedCategory, setSuggestedCategory] = useState('');

  useEffect(() => {
    if (formData.description && !formData.category) {
      const description = formData.description.toLowerCase();
      const availableCategories = formData.type === 'income' ? incomeCategories : categories;
      
      // Simple keyword matching for category suggestions
      const categoryKeywords = {
        'Food': ['food', 'restaurant', 'grocery', 'lunch', 'dinner', 'breakfast', 'coffee', 'pizza'],
        'Transportation': ['gas', 'fuel', 'uber', 'taxi', 'bus', 'train', 'parking', 'car'],
        'Entertainment': ['movie', 'netflix', 'spotify', 'game', 'concert', 'theater'],
        'Shopping': ['amazon', 'store', 'clothes', 'shoes', 'shopping'],
        'Utilities': ['electric', 'water', 'internet', 'phone', 'bill'],
        'Rent': ['rent', 'mortgage', 'housing'],
        'Healthcare': ['doctor', 'medicine', 'pharmacy', 'hospital', 'health'],
        'Education': ['school', 'course', 'book', 'tuition'],
        'Salary': ['salary', 'paycheck', 'wage'],
        'Freelance': ['freelance', 'contract', 'gig']
      };

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (availableCategories.includes(category) && 
            keywords.some(keyword => description.includes(keyword))) {
          setSuggestedCategory(category);
          break;
        }
      }
    }
  }, [formData.description, formData.type, formData.category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.description) {
      return;
    }

    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
    };

    if (transaction) {
      updateTransaction(transaction.id, transactionData);
    } else {
      addTransaction(transactionData);
    }
    
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset category when type changes
      ...(name === 'type' && { category: '' })
    }));
  };

  const applySuggestedCategory = () => {
    setFormData(prev => ({ ...prev, category: suggestedCategory }));
    setSuggestedCategory('');
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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          {suggestedCategory && !formData.category && (
            <button
              type="button"
              onClick={applySuggestedCategory}
              className="text-xs text-primary hover:text-indigo-700 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded"
            >
              Suggest: {suggestedCategory}
            </button>
          )}
        </div>
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
          Date
        </label>
        <input
          type="date"
          name="date"
          value={formData.date}
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
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Add tags to organize your transactions
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes (optional)
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          placeholder="Additional notes about this transaction"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {transaction ? 'Update' : 'Add'} Transaction
        </Button>
      </div>
    </form>
  );
};

export default TransactionForm;