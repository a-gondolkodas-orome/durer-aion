import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { startWindowState, type Language, type StartWindow, type StartWindowState } from "schemas";
import { useUiLanguage } from "./ui-language";

// setTimeout fires at once for a delay past this, so a farther boundary is
// waited for in steps.
const MAX_TIMEOUT = 2 ** 31 - 1;

/// The next moment the window's state changes after `now`, if any.
export function nextBoundary(startWindow: StartWindow, now: Date): number | undefined {
  return [startWindow.opensAt, startWindow.closesAt]
    .filter(each => each !== undefined)
    .map(each => Date.parse(each))
    .find(time => time > now.getTime());
}

/// Where the browser's clock is against the team's start window, kept current:
/// the page changes when the window opens or closes without a reload. The
/// server decides a start by its own clock; this is only what the page says.
export function useStartWindowState(startWindow: StartWindow | null | undefined): StartWindowState {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (startWindow === null || startWindow === undefined) return;
    const next = nextBoundary(startWindow, now);
    if (next === undefined) return;
    const timer = setTimeout(() => { setNow(new Date()); }, Math.min(next - now.getTime(), MAX_TIMEOUT));
    return () => { clearTimeout(timer); };
  }, [startWindow, now]);
  return startWindowState(startWindow ?? undefined, now);
}

/// A time of the start window as the team reads it: its date and its time, in
/// the browser's time zone.
function windowTime(time: string, language: Language): string {
  return new Intl.DateTimeFormat(language, {
    month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(time));
}

/// What the team is told about when the rounds may start, if anything.
function windowNote(
  state: StartWindowState, startWindow: StartWindow | null | undefined, language: Language, t: TFunction,
): string | undefined {
  if (startWindow === null || startWindow === undefined) return undefined;
  if (state === "not-open-yet") return t("chooser.window.notOpenYet", { time: windowTime(startWindow.opensAt, language) });
  if (state === "closed") return t("chooser.window.closed");
  return startWindow.closesAt === undefined
    ? undefined
    : t("chooser.window.openUntil", { time: windowTime(startWindow.closesAt, language) });
}

/// The window's state, kept current, and what the disclaimer and the home
/// screen say about it.
export function useStartWindowNote(startWindow: StartWindow | null | undefined):
  { state: StartWindowState, note: string | undefined } {
  const state = useStartWindowState(startWindow);
  const language = useUiLanguage();
  const { t } = useTranslation();
  return { state, note: windowNote(state, startWindow, language, t) };
}
