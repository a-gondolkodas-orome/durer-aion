import React from 'react';
import { useLanguage } from './language-context';

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  return (
    <span className="text-sm whitespace-nowrap">
      <button
        onClick={() => setLanguage('hu')}
        className={`px-1 ${language === 'hu' ? 'font-bold' : 'opacity-40 hover:opacity-70'}`}
        aria-label="Magyar"
      >HU</button>
      <span className="opacity-40" aria-hidden="true">|</span>
      <button
        onClick={() => setLanguage('en')}
        className={`px-1 ${language === 'en' ? 'font-bold' : 'opacity-40 hover:opacity-70'}`}
        aria-label="English"
      >EN</button>
    </span>
  );
};
