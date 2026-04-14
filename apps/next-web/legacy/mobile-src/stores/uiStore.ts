import { create } from 'zustand';

type UIState = {
  isAddTransactionOpen: boolean;
  transactionSearchQuery: string;
  openAddTransaction: () => void;
  closeAddTransaction: () => void;
  setTransactionSearchQuery: (query: string) => void;
};

export const useUIStore = create<UIState>((set) => ({
  isAddTransactionOpen: false,
  transactionSearchQuery: '',
  openAddTransaction: () => set({ isAddTransactionOpen: true }),
  closeAddTransaction: () => set({ isAddTransactionOpen: false }),
  setTransactionSearchQuery: (transactionSearchQuery) => set({ transactionSearchQuery }),
}));
