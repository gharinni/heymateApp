import React, { createContext, useContext, useState } from 'react';
import { DARK_COLORS, LIGHT_COLORS } from '../constants';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const toggleTheme = () => setIsDark(prev => !prev);
  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
