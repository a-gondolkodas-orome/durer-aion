import { useTheme } from './theme-context';

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  return (
    <span className="text-sm whitespace-nowrap text-white font-roboto">
      <button
        onClick={() => setTheme('light')}
        className={`px-1 ${theme === 'light' ? 'font-bold text-white' : 'opacity-50 hocus:opacity-70 text-white'}`}
        aria-label="Light mode"
      >☀</button>
      <span className="opacity-40 text-white" aria-hidden="true">|</span>
      <button
        onClick={() => setTheme('system')}
        className={`px-1 ${theme === 'system' ? 'font-bold text-white' : 'opacity-50 hocus:opacity-70 text-white'}`}
        aria-label="System theme"
      >◑</button>
      <span className="opacity-40 text-white" aria-hidden="true">|</span>
      <button
        onClick={() => setTheme('dark')}
        className={`px-1 ${theme === 'dark' ? 'font-bold text-white' : 'opacity-50 hocus:opacity-70 text-white'}`}
        aria-label="Dark mode"
      >☾</button>
    </span>
  );
};
