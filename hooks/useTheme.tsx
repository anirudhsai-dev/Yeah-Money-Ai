import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: typeof Colors.dark;
  themeSetting: ThemeType;
  setThemeSetting: (theme: ThemeType) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeSetting, setThemeSettingInternal] = useState<ThemeType>('system');

  useEffect(() => {
    async function loadTheme() {
      const savedTheme = await AsyncStorage.getItem('yeahmoney_theme');
      if (savedTheme) {
        setThemeSettingInternal(savedTheme as ThemeType);
      }
    }
    loadTheme();
  }, []);

  const setThemeSetting = async (newTheme: ThemeType) => {
    setThemeSettingInternal(newTheme);
    await AsyncStorage.setItem('yeahmoney_theme', newTheme);
  };

  const isDark = themeSetting === 'system'
    ? systemColorScheme === 'dark'
    : themeSetting === 'dark';

  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ theme, themeSetting, setThemeSetting, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return Colors.dark;
  }
  return context.theme;
}

export function useThemeConfig() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeConfig must be used within a ThemeProvider');
  }
  return {
    themeSetting: context.themeSetting,
    setThemeSetting: context.setThemeSetting,
    isDark: context.isDark
  };
}
