import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";
import { useSnackbar } from "notistack";
import type { SnackbarKey } from "notistack";
import { useEffect, useRef } from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";

/// A persistent error snackbar while the game's socket is down, then, once it
/// is back, a warning asking the team to check their last move or answer,
/// until they close it. boardgame.io reconnects and re-syncs on its own, but a
/// move sent before socket.io notices the drop is lost, and one sent after it
/// waits and is replayed on reconnect, where the server rejects it if the match
/// has moved on meanwhile. Either way the board can show a move that did not
/// count. Each is a snackbar rather than a banner, so it stays on screen above
/// a phone keyboard (see Layout).
///
/// The browser going offline needs no listener here: engine.io closes the
/// socket on the `offline` event itself, except for a server on localhost. A
/// network that stays up but carries nothing shows only at the ping timeout.
export function ConnectionAlert({ isConnected }: { isConnected: boolean }) {
  const { t } = useTranslation();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const keys = useRef<{ lost?: SnackbarKey, check?: SnackbarKey }>({});

  useEffect(() => {
    const shown = keys.current;
    if (!isConnected) {
      if (shown.check !== undefined) {
        closeSnackbar(shown.check);
        shown.check = undefined;
      }
      shown.lost ??= enqueueSnackbar(t('general.warning.connectionLost'), { variant: 'error', persist: true });
    } else if (shown.lost !== undefined) {
      closeSnackbar(shown.lost);
      shown.lost = undefined;
      shown.check = enqueueSnackbar(
        `${t('general.warning.connectionRestored')} ${t('general.warning.connectionRestoredHint')}`,
        {
          variant: 'warning',
          persist: true,
          action: key => (
            <IconButton size="small" color="inherit" aria-label={t('general.close')} onClick={() => closeSnackbar(key)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          ),
        },
      );
    }
  }, [isConnected, enqueueSnackbar, closeSnackbar, t]);

  // A persistent snackbar outlives the board otherwise, e.g. on the result page.
  useEffect(() => {
    const shown = keys.current;
    return () => {
      for (const key of [shown.lost, shown.check]) {
        if (key !== undefined) {
          closeSnackbar(key);
        }
      }
      shown.lost = shown.check = undefined;
    };
  }, [closeSnackbar]);

  return null;
}

/// For the socket.io clients only: a client without a multiplayer transport
/// reports `isConnected: false` for good, which would keep the snackbar up forever.
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
