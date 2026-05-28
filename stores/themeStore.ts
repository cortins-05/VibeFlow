import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeName } from '../constants/themes';

interface ThemeStore {
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      themeName: 'neon',
      setTheme: (name) => set({ themeName: name }),
    }),
    {
      name: 'vibeflow-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ themeName: state.themeName }),
    },
  ),
);
