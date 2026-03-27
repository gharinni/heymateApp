import React, { createContext, useContext, useState } from 'react';

const DARK = {
  bg:'#0D0D1A', card:'#1A1A2E', primary:'#FF5722', success:'#4CAF50',
  border:'#2A2A3E', text:'#FFFFFF', textMuted:'#9CA3AF', warning:'#F59E0B',
  input:'#1E1E30', danger:'#EF4444',
};

const LIGHT = {
  bg:'#F5F5F5', card:'#FFFFFF', primary:'#FF5722', success:'#4CAF50',
  border:'#E0E0E0', text:'#1A1A1A', textMuted:'#888888', warning:'#F59E0B',
  input:'#F0F0F0', danger:'#EF4444',
};

const ThemeContext = createContext(null);

export function AppThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const colors = isDark ? DARK : LIGHT;
  const toggleTheme = () => setIsDark(d => !d);
  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Return default dark theme if used outside provider
    return { colors: DARK, isDark: true, toggleTheme: () => {} };
  }
  return ctx;
}
