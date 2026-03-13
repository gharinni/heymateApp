import React, { createContext, useContext, useState } from 'react';

const DARK = {
  primary: '#FF5722',
  success: '#00C853',
  danger: '#FF1744',
  warning: '#FFD600',
  bg: '#0D0D1A',
  card: '#16213E',
  surface2: '#1E2D45',
  text: '#F0F0F0',
  textMuted: '#8892A4',
  border: '#2A3A5C',
};

const LIGHT = {
  primary: '#FF5722',
  success: '#00A846',
  danger: '#FF1744',
  warning: '#F59E0B',
  bg: '#F5F6FA',
  card: '#FFFFFF',
  surface2: '#F0F2F8',
  text: '#1A1A2E',
  textMuted: '#6B7280',
  border: '#E2E8F0',
};

const AppThemeContext = createContext({ isDark: true, colors: DARK, toggleTheme: () => {} });

export function AppThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  return (
    <AppThemeContext.Provider value={{ isDark, colors: isDark ? DARK : LIGHT, toggleTheme: () => setIsDark(p => !p) }}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(AppThemeContext);
}
