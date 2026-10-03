import { Alert } from "@mui/material";
import { useState } from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";

/// A red banner while the game's socket is down. boardgame.io reconnects and
/// re-syncs on its own, so this only tells the team why the board froze.
///
/// `isConnected` is false before the first connect too, so nothing shows until
/// the socket has been up once: a page load must not flash the banner.
export function ConnectionAlert({ isConnected }: { isConnected: boolean }) {
  const { t } = useTranslation();
  const [wasConnected, setWasConnected] = useState(isConnected);
  if (isConnected && !wasConnected) {
    setWasConnected(true);
  }
  if (isConnected || !wasConnected) {
    return null;
  }
  return (
    <Alert
      severity="error"
      variant="filled"
      role="alert"
      sx={{ position: 'sticky', top: 0, zIndex: 'appBar', borderRadius: 0 }}
    >
      {t('general.warning.connectionLost')}
    </Alert>
  );
}

/// For the socket.io clients only: a local client's transport reports
/// `isConnected: false` for good, which would keep the banner up forever.
export function withConnectionAlert<P extends { isConnected: boolean }>(Board: ComponentType<P>) {
  return (props: P) => (
    <>
      <ConnectionAlert isConnected={props.isConnected} />
      <Board {...props} />
    </>
  );
}
