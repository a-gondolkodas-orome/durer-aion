import type React from 'react';
import { useLanguage } from './language';
import type { I18nNode, Language, Translatable, TranslatableNode } from '../i18n';

const isI18nLike = (v: unknown): v is I18nNode =>
  typeof v === 'object' && v !== null && 'hu' in v;

export function translate(texts: Translatable, lang: Language): string;
export function translate(texts: TranslatableNode, lang: Language): React.ReactNode;
export function translate(texts: TranslatableNode, lang: Language): React.ReactNode {
  if (texts == null) return null;
  if (isI18nLike(texts)) return texts[lang] ?? texts.hu;
  return texts;
}

/** Hook that returns `t()` bound to the current language. */
export const useTranslation = () => {
  const { language } = useLanguage();
  function t(texts: Translatable): string;
  function t(texts: TranslatableNode): React.ReactNode;
  function t(texts: TranslatableNode): React.ReactNode {
    return translate(texts, language);
  }
  return { t };
};
