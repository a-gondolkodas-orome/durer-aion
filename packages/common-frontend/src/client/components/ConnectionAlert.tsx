import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";

export const CONNECTION_LOST_DELAY_MS = 2000;

/// While the socket is down, the board is inert and dimmed and a snackbar says
/// why. A move sent just before the drop is noticed is lost; the re-sync on
/// reconnect takes it back off the board.
///
/// Shorter drops than CONNECTION_LOST_DELAY_MS show nothing. engine.io closes
/// the socket on the browser's `offline` event itself (not for localhost); a
/// silent network shows only at the ping timeout.
///
/// Socket.io clients only: without a transport `isConnected` stays false for good.
export function withConnectionAlert<P extends { isConnected: boolean }>(Board: ComponentType<P>) {
  return (props: P) => {
    const down = useLongDisconnect(props.isConnected);
    const { t } = useTranslation();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    useEffect(() => {
      if (!down) {
        return;
      }
      // No fixed key: on a language switch notistack would drop the new
      // snackbar along with the old one.
      const key = enqueueSnackbar(t('general.warning.connectionLost'), { variant: 'error', persist: true });
      return () => closeSnackbar(key);
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
  // The reset lands a render after the reconnect.
  return !isConnected && expired;
}
