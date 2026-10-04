import { Alert, AlertTitle } from "@mui/material";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";

/// A red banner while the game's socket is down. boardgame.io reconnects and
/// re-syncs on its own, but a move or answer sent before socket.io notices the
/// drop is lost, so the banner asks the team to check theirs once it is gone.
///
/// The browser going offline needs no listener here: engine.io closes the
/// socket on the `offline` event itself, except for a server on localhost. A
/// network that stays up but carries nothing shows only at the ping timeout.
export function ConnectionAlert({ isConnected }: { isConnected: boolean }) {
  const { t } = useTranslation();
  if (isConnected) {
    return null;
  }
  return (
    <Alert
      severity="error"
      variant="filled"
      sx={{ position: 'sticky', top: 0, zIndex: 'appBar', borderRadius: 0 }}
    >
      <AlertTitle>{t('general.warning.connectionLost')}</AlertTitle>
      {t('general.warning.connectionLostHint')}
    </Alert>
  );
}

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
