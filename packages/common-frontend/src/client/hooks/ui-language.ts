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

/// The login page's language, before there is a competition to go by: the
/// one chosen, else Hungarian.
export function loginLanguage(chosen: string | null): Language {
  return isLanguage(chosen) ? chosen : 'hu';
}

// The practice sites' key and parameter, which the dry run shares an origin
// with: one choice serves all three there.
const storageKey = 'lang';
const searchParam = 'lang';

/// The language chosen: a `?lang=` link's, else the one last picked in the
/// switcher, else null. Storage may be unavailable, as in a private window;
/// that reads as no stored choice.
export function readChosenLanguage(): string | null {
  const linked = new URLSearchParams(window.location.search).get(searchParam);
  if (linked !== null) return linked;
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

/// Stores a pick in the switcher, and drops a `?lang=` the page opened with,
/// which would otherwise outrank the pick on the next reload.
export function rememberChosenLanguage(language: string) {
  try {
    localStorage.setItem(storageKey, language);
  } catch {
    // The choice then lasts until a reload, which is all it can.
  }
  const url = new URL(window.location.href);
  if (!url.searchParams.has(searchParam)) return;
  url.searchParams.delete(searchParam);
  window.history.replaceState(window.history.state, '', url);
}
