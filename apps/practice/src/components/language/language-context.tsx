import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Language } from './translate';

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextValue>({ language: 'hu', setLanguage: () => {} });

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [language, setLanguageState] = useState<Language>(
    () => (searchParams.get('lang') ?? localStorage.getItem('lang') ?? 'hu') as Language
  );

  // When the URL ?lang= param changes (e.g. direct link or back/forward),
  // sync it into state. Ignore navigations that drop the param entirely
  // (those happen on Link clicks and should keep the in-memory language).
  useEffect(() => {
    const langFromUrl = searchParams.get('lang') as Language | null;
    if (langFromUrl !== null && langFromUrl !== language) {
      setLanguageState(langFromUrl);
      if (langFromUrl === 'hu') localStorage.removeItem('lang');
      else localStorage.setItem('lang', langFromUrl);
    }
  }, [searchParams]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (lang === 'hu') localStorage.removeItem('lang');
    else localStorage.setItem('lang', lang);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (lang === 'hu') next.delete('lang');
        else next.set('lang', lang);
        return next;
      },
      { replace: true }
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
