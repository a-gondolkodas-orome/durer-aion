import React from 'react';
import { useLanguage } from './language-context';

/**
 * Resolves a potentially multilingual value to a single language.
 * - If `texts` is a plain string, number, or React element, it is returned as-is.
 * - If `texts` is an object with `hu`/`en` keys, the value for `lang` is returned,
 *   falling back to `hu` if the requested language is missing.
 */
export const translate = (texts, lang) => {
  if (texts === null || texts === undefined) return texts;
  if (typeof texts === 'string' || typeof texts === 'number') return texts;
  if (React.isValidElement(texts)) return texts;
  // Multilingual object: { hu: ..., en: ... }
  if (typeof texts === 'object' && ('hu' in texts || 'en' in texts)) {
    return texts[lang] ?? texts.hu;
  }
  return texts;
};

/** Hook that returns a `t()` function bound to the current language. */
export const useTranslation = () => {
  const { language } = useLanguage();
  return { t: (texts) => translate(texts, language) };
};
