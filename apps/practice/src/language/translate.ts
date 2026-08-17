import type React from 'react';
import { useLanguage } from './language-context';
import type { I18nNode, Language, Translatable, TranslatableNode } from 'engine';

// Re-exported rather than declared: a game's text shape is part of its
// configuration, so the engine names it (packages/engine/src/i18n.ts). This
// module is the React binding that resolves one to what a reader sees.
export type { I18nString, I18nNode, Language, Translatable, TranslatableNode } from 'engine';

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
