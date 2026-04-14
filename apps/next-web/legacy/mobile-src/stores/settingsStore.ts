import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';

type SettingsState = {
  profileName: string;
  currency: string;
  theme: ThemePreference;
  setProfileName: (value: string) => void;
  setCurrency: (value: string) => void;
  setTheme: (value: ThemePreference) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  profileName: 'SmartSpend User',
  currency: 'USD',
  theme: 'system',
  setProfileName: (profileName) => set({ profileName }),
  setCurrency: (currency) => set({ currency }),
  setTheme: (theme) => set({ theme }),
}));
