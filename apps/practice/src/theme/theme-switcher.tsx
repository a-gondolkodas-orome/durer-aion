import { useTheme } from './theme-context';

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  return (
    <span className="text-sm whitespace-nowrap">
      <button
        onClick={() => setTheme('light')}
        className={`px-1 ${theme === 'light' ? 'font-bold' : 'opacity-40 hocus:opacity-70'}`}
        aria-label="Light mode"
      >☀</button>
      <span className="opacity-40" aria-hidden="true">|</span>
      <button
        onClick={() => setTheme('system')}
        className={`px-1 ${theme === 'system' ? 'font-bold' : 'opacity-40 hocus:opacity-70'}`}
        aria-label="System theme"
      >◑</button>
      <span className="opacity-40" aria-hidden="true">|</span>
      <button
        onClick={() => setTheme('dark')}
        className={`px-1 ${theme === 'dark' ? 'font-bold' : 'opacity-40 hocus:opacity-70'}`}
        aria-label="Dark mode"
      >☾</button>
    </span>
  );
};
