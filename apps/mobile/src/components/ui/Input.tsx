import { useMemo } from 'react';
import { Text, TextInput, View } from 'react-native';

type InputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  onBlur?: () => void;
};

export function Input({ label, value, onChangeText, placeholder, keyboardType = 'default', onBlur }: InputProps) {
  const labelId = useMemo(
    () => `input-label-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'field'}`,
    [label]
  );

  return (
    <View className="gap-1 border-b border-neutral-100 pb-2">
      <Text nativeID={labelId} className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
        {label}
      </Text>
      <TextInput
        className="px-0 py-1 text-xl font-bold text-neutral-900"
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#D4D4D4"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        onBlur={onBlur}
        accessibilityLabelledBy={labelId}
      />
    </View>
  );
}
