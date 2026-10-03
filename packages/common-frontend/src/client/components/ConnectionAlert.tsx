import { Alert } from "@mui/material";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { VISUAL_VIEWPORT_TOP } from "../hooks/visual-viewport";

/// A red banner while the game's socket is down. boardgame.io reconnects and
/// re-syncs on its own, and socket.io holds what is sent meanwhile until then,
/// so this only tells the team why nothing seems to happen.
///
/// No "has it ever connected" guard: boardgame.io renders its loading screen
/// instead of the board until the first sync, which needs a connected socket.
export function ConnectionAlert({ isConnected }: { isConnected: boolean }) {
  const { t } = useTranslation();
  if (isConnected) {
    return null;
  }
  return (
    <Alert
      severity="error"
      variant="filled"
      sx={{ position: 'sticky', top: VISUAL_VIEWPORT_TOP, zIndex: 'appBar', borderRadius: 0 }}
    >
      {t('general.warning.connectionLost')}
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
