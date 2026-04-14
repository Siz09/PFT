import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import type { OCRExtractedFields } from '../../services/OCRService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type OCRReviewFormProps = {
  initialValues: OCRExtractedFields;
  onCancel: () => void;
  onSubmit: (value: OCRExtractedFields) => Promise<void>;
};

const isValidIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const confidenceLabel = (value: number) => {
  if (value >= 0.9) {
    return { text: 'High confidence', colorClassName: 'text-emerald-700' };
  }
  if (value >= 0.75) {
    return { text: 'Medium confidence', colorClassName: 'text-amber-700' };
  }
  return { text: 'Low confidence - review carefully', colorClassName: 'text-red-700' };
};

export function OCRReviewForm({ initialValues, onCancel, onSubmit }: OCRReviewFormProps) {
  const [amount, setAmount] = useState(String((initialValues.amountCents / 100).toFixed(2)));
  const [merchant, setMerchant] = useState(initialValues.merchant);
  const [description, setDescription] = useState(initialValues.description);
  const [categoryId, setCategoryId] = useState(initialValues.categoryId);
  const [date, setDate] = useState(initialValues.date);
  const [isSaving, setIsSaving] = useState(false);

  const confidenceInfo = useMemo(() => confidenceLabel(initialValues.confidence), [initialValues.confidence]);

  const submit = async () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation', 'Amount must be greater than 0.');
      return;
    }
    if (!isValidIsoDate(date)) {
      Alert.alert('Validation', 'Date must use YYYY-MM-DD.');
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({
        amountCents: Math.round(parsedAmount * 100),
        merchant: merchant.trim(),
        description: description.trim(),
        categoryId: categoryId.trim() || 'Other',
        date,
        confidence: initialValues.confidence,
      });
    } catch (error) {
      console.error('OCR review save failed', error);
      const message = error instanceof Error ? error.message : 'Failed to save reviewed transaction.';
      Alert.alert('Save failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="gap-5">
      <View className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <Text className="text-sm font-semibold text-neutral-700">OCR result ready</Text>
        <Text className={`mt-1 text-sm font-semibold ${confidenceInfo.colorClassName}`}>{confidenceInfo.text}</Text>
      </View>

      <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <Input label="Category" value={categoryId} onChangeText={setCategoryId} />
      <Input label="Merchant" value={merchant} onChangeText={setMerchant} />
      <Input label="Description" value={description} onChangeText={setDescription} />
      <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />

      <View className="flex-row gap-3 pt-2">
        <View className="flex-1">
          <Button label="Retake" variant="secondary" onPress={onCancel} />
        </View>
        <View className="flex-1">
          <Button label={isSaving ? 'Saving...' : 'Save'} onPress={submit} disabled={isSaving} />
        </View>
      </View>
    </View>
  );
}
