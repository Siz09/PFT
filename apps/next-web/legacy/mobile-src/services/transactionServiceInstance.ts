import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionService } from './TransactionService';

export const createTransactionService = (repository?: TransactionRepository) =>
  new TransactionService(repository ?? new TransactionRepository());
