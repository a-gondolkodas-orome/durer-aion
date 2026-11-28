import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/// Ending the strategy round early (#111) is offered from the header's rounds
/// menu, which `Main` renders outside the game's client, while only the board
/// knows whether the team may end it now and asks it to confirm. The board
/// offers its action here; the header shows a button for it while it is
/// offered.
interface EndRound {
  action: (() => void) | null,
  setAction: (action: (() => void) | null) => void,
}

const EndRoundContext = createContext<EndRound>({ action: null, setAction: () => undefined });

export function EndRoundProvider(props: { children: ReactNode }) {
  const [action, setStored] = useState<(() => void) | null>(null);
  // Stable, as the board's effect depends on it. A function given to a state
  // setter is called as an updater, so it is wrapped to be stored as it is.
  const setAction = useCallback((next: (() => void) | null) => setStored(() => next), []);
  const value = useMemo(() => ({ action, setAction }), [action, setAction]);
  return <EndRoundContext.Provider value={value}>{props.children}</EndRoundContext.Provider>;
}

/// What the header's button does, or null while there is nothing to offer.
export function useEndRoundAction(): (() => void) | null {
  return useContext(EndRoundContext).action;
}

/// Offers `action` while it is not null and the caller is mounted. Pass a
/// stable function: a new one each render offers it anew each render.
export function useOfferEndRound(action: (() => void) | null) {
  const { setAction } = useContext(EndRoundContext);
  useEffect(() => {
    setAction(action);
    return () => setAction(null);
  }, [action, setAction]);
}
