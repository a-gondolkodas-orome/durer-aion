import { useEffect, useState } from "react";
import { startWindowState, type StartWindow, type StartWindowState } from "schemas";

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
