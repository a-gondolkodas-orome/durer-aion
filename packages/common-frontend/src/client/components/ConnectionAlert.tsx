import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";

export const CONNECTION_LOST_DELAY_MS = 2000;

/// While the game's socket is down, the board is inert and dimmed, and a
/// persistent snackbar says why. A move sent while disconnected would be
/// replayed on reconnect and rejected if the match has moved on meanwhile. One
/// sent before socket.io notices the drop is lost, but the re-sync on reconnect
/// replaces the board's state with the server's, which takes the move back.
///
/// A drop shorter than CONNECTION_LOST_DELAY_MS, e.g. a Wi-Fi handover, shows
/// nothing. The browser going offline needs no listener here: engine.io closes
/// the socket on the `offline` event itself, except for a server on localhost.
/// A network that stays up but carries nothing shows only at the ping timeout.
///
/// For the socket.io clients only: a client without a multiplayer transport
/// reports `isConnected: false` for good, which would keep the board disabled.
export function withConnectionAlert<P extends { isConnected: boolean }>(Board: ComponentType<P>) {
  return (props: P) => {
    const down = useLongDisconnect(props.isConnected);
    const { t } = useTranslation();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
      if (!down) {
        return;
      }
      enqueueSnackbar(t('general.warning.connectionLost'), { key: 'connection-lost', variant: 'error', persist: true });
      return () => closeSnackbar('connection-lost');
    }, [down, enqueueSnackbar, closeSnackbar, t]);

    return <div inert={down} style={down ? { opacity: 0.5 } : undefined}>
      <Board {...props}/>
    </div>;
  };
}

function useLongDisconnect(isConnected: boolean) {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (isConnected) {
      return;
    }
    const timer = setTimeout(() => setExpired(true), CONNECTION_LOST_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setExpired(false);
    };
  }, [isConnected]);
  // The reset above lands a render after the reconnect.
  return !isConnected && expired;
}
