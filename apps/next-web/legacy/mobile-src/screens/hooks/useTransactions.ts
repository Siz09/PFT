import { useCallback, useEffect, useRef, useState } from 'react';

import { createTransactionService } from '../../services/transactionServiceInstance';
import type { CreateTransactionInput, TransactionRecord } from '../../types/finance';

export function useTransactions() {
  const transactionServiceRef = useRef(createTransactionService());
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastRequestId = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++lastRequestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const items = await transactionServiceRef.current.query({ limit: 50 });
      if (requestId === lastRequestId.current) {
        setTransactions(items);
      }
    } catch (loadError) {
      if (requestId === lastRequestId.current) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load transactions';
        setError(message);
      }
    } finally {
      if (requestId === lastRequestId.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const create = useCallback(
    async (payload: CreateTransactionInput) => {
      await transactionServiceRef.current.create(payload);
      await load();
    },
    [load]
  );

  useEffect(() => {
    load().catch((loadError) => {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load transactions';
      setError(message);
      setIsLoading(false);
    });
  }, [load]);

  return {
    transactions,
    isLoading,
    error,
    reload: load,
    create,
  };
}
