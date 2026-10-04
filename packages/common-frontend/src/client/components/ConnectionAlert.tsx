import { Alert, AlertTitle } from "@mui/material";
import { useSyncExternalStore, type ComponentType } from "react";
import { useTranslation } from "react-i18next";

function subscribeToOnline(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

/// A red banner while the game's socket is down. boardgame.io reconnects and
/// re-syncs on its own, but a move or answer sent before socket.io notices the
/// drop is lost, so the banner asks the team to check theirs once it is gone.
///
/// socket.io notices a plain network drop only at its ping timeout, so the
/// browser going offline shows the banner at once.
export function ConnectionAlert({ isConnected }: { isConnected: boolean }) {
  const { t } = useTranslation();
  const online = useSyncExternalStore(subscribeToOnline, () => navigator.onLine, () => true);
  if (online && isConnected) {
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

/// For the socket.io clients only: a local client's transport reports
/// `isConnected: false` for good, which would keep the banner up forever.
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
