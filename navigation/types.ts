import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Root stack — wraps the tab navigator and modal screens
export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  Settings: undefined;
};

// Bottom tab navigator
export type TabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Scan: undefined;
  Budget: undefined;
  Reports: undefined;
};

// Screen prop helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
