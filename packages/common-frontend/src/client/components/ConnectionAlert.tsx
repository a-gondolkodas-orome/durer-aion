import { Alert, AlertTitle } from "@mui/material";
import { useState } from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";

/// A red banner while the game's socket is down, then, once it is back, a
/// notice asking the team to check their last move or answer, until they
/// close it. boardgame.io reconnects and re-syncs on its own, but a move sent
/// before socket.io notices the drop is lost, and one sent after it waits and
/// is replayed on reconnect, where the server rejects it if the match has
/// moved on meanwhile. Either way the board can show a move that did not count.
///
/// The browser going offline needs no listener here: engine.io closes the
/// socket on the `offline` event itself, except for a server on localhost. A
/// network that stays up but carries nothing shows only at the ping timeout.
export function ConnectionAlert({ isConnected }: { isConnected: boolean }) {
  const { t } = useTranslation();
  const [mustCheck, setMustCheck] = useState(false);
  if (!isConnected && !mustCheck) {
    setMustCheck(true);
  }
  if (!isConnected) {
    return (
      <Alert severity="error" variant="filled" sx={bannerSx}>
        <AlertTitle>{t('general.warning.connectionLost')}</AlertTitle>
      </Alert>
    );
  }
  if (!mustCheck) {
    return null;
  }
  return (
    <Alert severity="warning" variant="filled" sx={bannerSx} onClose={() => setMustCheck(false)}>
      <AlertTitle>{t('general.warning.connectionRestored')}</AlertTitle>
      {t('general.warning.connectionRestoredHint')}
    </Alert>
  );
}

const bannerSx = { position: 'sticky', top: 0, zIndex: 'appBar', borderRadius: 0 } as const;

/// For the socket.io clients only: a client without a multiplayer transport
/// reports `isConnected: false` for good, which would keep the banner up forever.
export function withConnectionAlert<P extends { isConnected: boolean }>(Board: ComponentType<P>) {
  const WithConnectionAlert = (props: P) => (
    <>
      <ConnectionAlert isConnected={props.isConnected} />
      <Board {...props} />
    </>
  );
  WithConnectionAlert.displayName = `withConnectionAlert(${Board.displayName ?? Board.name})`;
  return WithConnectionAlert;
}
