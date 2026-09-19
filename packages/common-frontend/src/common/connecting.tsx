import { Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/** How long the board may stay empty before the team is told what to do about
 *  it. Long enough that an ordinary slow start does not trip it, short enough
 *  to be worth reading while the match clock runs. */
const PATIENCE_MS = 8000;

/** What boardgame.io shows while a multiplayer client has no state yet.
 *
 * Its own default is an English "connecting…" that never changes, and a team
 * can be left on it for the rest of the round: the client asks the server for
 * the match once, when the socket connects, and nothing makes it ask again. So
 * a request the server refuses, or one lost to a hiccup behind it, is a board
 * that never arrives — and the match clock does not stop for it. Reloading the
 * page is what asks again, so after a while this says so.
 */
export function Connecting() {
  const { t } = useTranslation();
  const [waitedTooLong, setWaitedTooLong] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => { setWaitedTooLong(true); }, PATIENCE_MS);
    return () => { clearTimeout(handle); };
  }, []);

  return (
    <Stack sx={{ alignItems: "center", gap: 2, padding: 4 }}>
      <Typography>{t('general.loading')}</Typography>
      {waitedTooLong && (
        <>
          <Typography>{t('general.notLoading')}</Typography>
          <Button variant="contained" onClick={() => { window.location.reload(); }}>
            {t('general.reload')}
          </Button>
        </>
      )}
    </Stack>
  );
}
