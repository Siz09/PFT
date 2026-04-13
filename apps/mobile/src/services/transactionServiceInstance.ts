import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionService } from './TransactionService';

export const transactionService = new TransactionService(new TransactionRepository());
