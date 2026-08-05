import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import type { Language } from './translate';

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
  //
  // Unlike the move-scoped and per-key state elsewhere, this is not derivable:
  // the URL is only *one* of two inputs (the other being setLanguage, which
  // writes both state and the URL), and the effect also writes localStorage.
  // Deriving during render would mean choosing a winner between them on every
  // render and doing IO there, so the effect stays and the rule is suppressed
  // here rather than repo-wide. `language` is excluded from the deps on
  // purpose: re-running when it changes would fight the setLanguage path.
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    const langFromUrl = searchParams.get('lang') as Language | null;
    if (langFromUrl !== null && langFromUrl !== language) {
      setLanguageState(langFromUrl);
      if (langFromUrl === 'hu') localStorage.removeItem('lang');
      else localStorage.setItem('lang', langFromUrl);
    }
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

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
