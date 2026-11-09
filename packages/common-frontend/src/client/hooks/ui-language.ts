import { useTranslation } from "react-i18next";
import { isLanguage, type Language } from "schemas";

/// The language the page is showing, which is what a board picks a problem's
/// or a game's text by. i18n.ts loads only `hu` and `en`, and falls back to `hu`.
export function useUiLanguage(): Language {
  const { i18n } = useTranslation();
  return isLanguage(i18n.language) ? i18n.language : 'hu';
}
