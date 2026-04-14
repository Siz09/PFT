import type { ReactNode } from 'react';
import { Modal as RNModal, Pressable, View } from 'react-native';

type ModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ visible, onClose, children }: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <Pressable className="flex-1" onPress={(event) => event.stopPropagation()}>
          <View className="mt-auto rounded-t-3xl bg-white p-5">{children}</View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
