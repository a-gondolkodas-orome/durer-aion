import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useRef } from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";

/// A persistent snackbar while the game's socket is down, then one asking the
/// team to check their last move or answer, until they close it. boardgame.io
/// reconnects and re-syncs on its own, but a move sent before socket.io notices
/// the drop is lost, and one sent after it is replayed on reconnect and rejected
/// if the match has moved on meanwhile.
///
/// The browser going offline needs no listener here: engine.io closes the
/// socket on the `offline` event itself, except for a server on localhost. A
/// network that stays up but carries nothing shows only at the ping timeout.
function ConnectionAlert({ isConnected }: { isConnected: boolean }) {
  const { t } = useTranslation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const wasDown = useRef(false);

  useEffect(() => {
    if (!isConnected) {
      wasDown.current = true;
      closeSnackbar('connection-check');
      enqueueSnackbar(t('general.warning.connectionLost'), { key: 'connection-lost', variant: 'error', persist: true });
    } else if (wasDown.current) {
      wasDown.current = false;
      closeSnackbar('connection-lost');
      enqueueSnackbar(t('general.warning.connectionRestored'), {
        key: 'connection-check', variant: 'warning', persist: true,
        action: <IconButton color="inherit" aria-label={t('general.close')} onClick={() => closeSnackbar('connection-check')}>
          <CloseIcon/>
        </IconButton>,
      });
    }
  }, [isConnected, enqueueSnackbar, closeSnackbar, t]);

  // A persistent snackbar outlives the board otherwise, e.g. on the result page.
  useEffect(() => () => {
    closeSnackbar('connection-lost');
    closeSnackbar('connection-check');
  }, [closeSnackbar]);

  return null;
}

/// For the socket.io clients only: a client without a multiplayer transport
/// reports `isConnected: false` for good, which would keep the snackbar up forever.
export function withConnectionAlert<P extends { isConnected: boolean }>(Board: ComponentType<P>) {
  return (props: P) => <>
    <ConnectionAlert isConnected={props.isConnected}/>
    <Board {...props}/>
  </>;
}
