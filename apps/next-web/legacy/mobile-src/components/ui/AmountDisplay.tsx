import { Text } from 'react-native';

import type { TransactionType } from '../../types/finance';

type AmountDisplayProps = {
  amountCents: number;
  type: TransactionType;
  currency: string;
};

export function AmountDisplay({ amountCents, type, currency }: AmountDisplayProps) {
  const signedCents = type === 'expense' ? -Math.abs(amountCents) : Math.abs(amountCents);
  const signedValue = signedCents / 100;
  const colorClass = signedValue < 0 ? 'text-black' : 'text-emerald-600';
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  });

  return <Text className={`text-xl font-bold tracking-tight ${colorClass}`}>{formatter.format(signedValue)}</Text>;
}
