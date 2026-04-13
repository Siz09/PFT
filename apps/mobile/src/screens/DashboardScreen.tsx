import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';

import { Card } from '../components/ui/Card';
import { TransactionCard } from '../components/transactions/TransactionCard';
import { useTransactions } from './hooks/useTransactions';
import { useSettingsStore } from '../stores/settingsStore';

export function DashboardScreen() {
  const currency = useSettingsStore((state) => state.currency);
  const { transactions, isLoading } = useTransactions();

  const summary = useMemo(() => {
    let incomeCents = 0;
    let expenseCents = 0;

    for (const item of transactions) {
      if (item.type === 'income') {
        incomeCents += item.amountCents;
      } else {
        expenseCents += item.amountCents;
      }
    }

    return {
      incomeCents,
      expenseCents,
      netCents: incomeCents - expenseCents,
    };
  }, [transactions]);

  const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency });
  const recent = transactions.slice(0, 3);

  return (
    <FlatList
      className="flex-1 bg-white px-4 pt-4"
      data={recent}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View className="mb-8 gap-7">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-semibold tracking-tight text-black">SmartSpend</Text>
            <Text className="rounded-full border border-neutral-100 px-3 py-2 text-xs font-bold text-neutral-500">PFT</Text>
          </View>

          <View className="items-center py-2">
            <Text className="text-5xl font-medium tracking-tight text-black">{formatter.format(summary.netCents / 100)}</Text>
            <Text className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Available Balance</Text>
          </View>

          <Card>
            <View className="gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">Total Income</Text>
                <Text className="text-xl font-bold text-emerald-600">{formatter.format(summary.incomeCents / 100)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">Total Expense</Text>
                <Text className="text-xl font-bold text-black">{formatter.format(summary.expenseCents / 100)}</Text>
              </View>
            </View>
          </Card>

          <View className="flex-row items-end justify-between">
            <Text className="text-xl font-semibold tracking-tight text-black">Recent Transactions</Text>
            <Text className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">
              {isLoading ? 'Loading' : `${transactions.length} total`}
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => <TransactionCard item={item} currency={currency} />}
      ListEmptyComponent={
        isLoading ? null : <Text className="py-8 text-center text-sm font-medium text-neutral-400">No transactions yet.</Text>
      }
      contentContainerStyle={{ paddingBottom: 120 }}
    />
  );
}
