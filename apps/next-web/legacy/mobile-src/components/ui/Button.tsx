import { Pressable, Text } from 'react-native';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function Button({ label, onPress, variant = 'primary', disabled = false, accessibilityLabel }: ButtonProps) {
  const baseClass = 'rounded-2xl px-4 py-4';
  const variantClass =
    variant === 'primary'
      ? 'bg-black active:opacity-90'
      : 'border-2 border-neutral-100 bg-white active:bg-neutral-50';
  const textClass = variant === 'primary' ? 'text-white' : 'text-neutral-900';
  const disabledClass = disabled ? 'opacity-50' : '';

  return (
    <Pressable
      className={`${baseClass} ${variantClass} ${disabledClass}`}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
    >
      <Text className={`text-center text-base font-bold tracking-tight ${textClass}`}>{label}</Text>
    </Pressable>
  );
}
