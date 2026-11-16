import { useTranslation } from "react-i18next";
import { errorMessage } from "./i18n-error";

/** `errorMessage` in the language the page is shown in. */
export function useErrorMessage() {
  const { t } = useTranslation();
  return (e: unknown) => errorMessage(e, t);
}
