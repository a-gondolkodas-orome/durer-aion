import { useTranslation } from "react-i18next";
import { isLanguage, type Language } from "schemas";

/// The language the page is showing, which is what a board picks a problem's
/// or a game's text by. i18n.ts loads only `hu` and `en`, and falls back to `hu`.
export function useUiLanguage(): Language {
  const { i18n } = useTranslation();
  return isLanguage(i18n.language) ? i18n.language : 'hu';
}

/// The language a team plays in: the one it chose, if its competition is held
/// in it, else the competition's first. A choice the competition does not have
/// is ignored, not dropped, so it holds again for a competition that has it.
export function competitionLanguage(languages: readonly Language[], chosen: string | null): Language {
  if (isLanguage(chosen) && languages.includes(chosen)) return chosen;
  return languages[0] ?? 'hu';
}

// The practice sites' key, which the dry run shares an origin with: one choice
// serves all three there.
const storageKey = 'lang';

/// The language last chosen in the switcher, null if none. Storage may be
/// unavailable, as in a private window; that reads as no choice.
export function readChosenLanguage(): string | null {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function storeChosenLanguage(language: string) {
  try {
    localStorage.setItem(storageKey, language);
  } catch {
    // The choice then lasts until a reload, which is all it can.
  }
}
