import React, {createContext, useContext, useMemo} from 'react';
import {useColorScheme} from 'react-native';
import {lightColors, darkColors, type Colors} from './colors';
import {spacing, borderRadius} from './spacing';
import {typography} from './typography';

export type ThemeMode = 'light' | 'dark' | 'system';

interface Theme {
  colors: Colors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  isDark: boolean;
}

const ThemeContext = createContext<Theme>({
  colors: lightColors,
  spacing,
  borderRadius,
  typography,
  isDark: false,
});

interface ThemeProviderProps {
  mode: ThemeMode;
  children: React.ReactNode;
}

export function ThemeProvider({mode, children}: ThemeProviderProps) {
  const systemScheme = useColorScheme();

  const theme = useMemo<Theme>(() => {
    const isDark =
      mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
    return {
      colors: isDark ? darkColors : lightColors,
      spacing,
      borderRadius,
      typography,
      isDark,
    };
  }, [mode, systemScheme]);

  return React.createElement(ThemeContext.Provider, {value: theme}, children);
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export {spacing, borderRadius, typography};
export type {Colors, Theme};
