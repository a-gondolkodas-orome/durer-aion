import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'system', setTheme: () => {} });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme | null) ?? 'system'
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      return;
    }
    if (theme === 'light') {
      root.classList.remove('dark');
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (dark: boolean) => root.classList.toggle('dark', dark);
    apply(mq.matches);
    const listener = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (t === 'system') localStorage.removeItem('theme');
    else localStorage.setItem('theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
