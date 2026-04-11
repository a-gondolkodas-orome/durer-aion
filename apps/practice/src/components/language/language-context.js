import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';

const LanguageContext = createContext({ language: 'hu', setLanguage: () => {} });

export const LanguageProvider = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [language, setLanguageState] = useState(
    () => searchParams.get('lang') ?? localStorage.getItem('lang') ?? 'hu'
  );

  // When the URL ?lang= param changes (e.g. direct link or back/forward),
  // sync it into state. Ignore navigations that drop the param entirely
  // (those happen on Link clicks and should keep the in-memory language).
  useEffect(() => {
    const langFromUrl = searchParams.get('lang');
    if (langFromUrl !== null && langFromUrl !== language) {
      setLanguageState(langFromUrl);
      if (langFromUrl === 'hu') localStorage.removeItem('lang');
      else localStorage.setItem('lang', langFromUrl);
    }
  }, [searchParams]);

  const setLanguage = (lang) => {
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
