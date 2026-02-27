import React, { createContext, useContext, useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

const ThemeModeContext = createContext({
  mode: 'light',
  toggleColorMode: () => {}
});

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');

  const toggleColorMode = () => {
    setMode((prev) => {
      const nextMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', nextMode);
      return nextMode;
    });
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#1f64ff' : '#6b9dff'
          },
          background: {
            default: mode === 'light' ? '#f4f7ff' : '#0f1424',
            paper: mode === 'light' ? '#ffffff' : '#141b2d'
          }
        },
        shape: {
          borderRadius: 12
        }
      }),
    [mode]
  );

  return (
    <ThemeModeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
