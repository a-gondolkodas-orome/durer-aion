import { useLanguage } from 'engine/react';

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  return (
    <span className="text-sm whitespace-nowrap text-white" style={{ fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
      <button
        onClick={() => setLanguage('hu')}
        className={`px-1 ${language === 'hu' ? 'font-bold text-white' : 'opacity-50 hover:opacity-70 text-white'}`}
        aria-label="Magyar"
      >HU</button>
      <span className="opacity-40 text-white" aria-hidden="true">|</span>
      <button
        onClick={() => setLanguage('en')}
        className={`px-1 ${language === 'en' ? 'font-bold text-white' : 'opacity-50 hover:opacity-70 text-white'}`}
        aria-label="English"
      >EN</button>
    </span>
  );
};
