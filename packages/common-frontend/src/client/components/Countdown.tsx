import { Dispatch, PropsWithoutRef, SetStateAction, useEffect, useEffectEvent, useState } from "react";
import ReportIcon from '@mui/icons-material/Report';
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

// The remaining time a board shows: counted down locally by Countdown, and reset
// to the server's figure whenever a new one arrives.
export function useMsRemaining(serverMs: number) {
    const [msRemaining, setMsRemaining] = useState(serverMs);
    const [lastServerMs, setLastServerMs] = useState(serverMs);
    if (lastServerMs !== serverMs) {
        setLastServerMs(serverMs);
        setMsRemaining(serverMs);
    }
    return [msRemaining, setMsRemaining] as const;
}

export function Countdown(
  props: PropsWithoutRef<{
    msRemaining: number | null,
    setMsRemaining: Dispatch<SetStateAction<number>>,
    endTime: Date,
    getServerTimer: () => void,
    serverRemainingMs: number;
  }>
) {
    const { msRemaining, setMsRemaining, endTime, getServerTimer, serverRemainingMs } = props
    const { t } = useTranslation();
    const endMs = new Date(endTime).getTime();
    // How far our clock is from the server's, measured once per server reading:
    // re-measuring on every render would fold the time elapsed since the reading
    // into it. Object.is, because an unparseable endTime makes endMs NaN, which
    // `!==` would take for a new reading on every render.
    const [clock, setClock] = useState(() => measureClock(endMs, serverRemainingMs));
    if (!Object.is(clock.endMs, endMs) || !Object.is(clock.serverRemainingMs, serverRemainingMs)) {
        setClock(measureClock(endMs, serverRemainingMs));
    }
    const { offset } = clock;
    const tick = useEffectEvent(() => {
        const diff = endMs - new Date().getTime() - (offset > 5000 || offset < -5000 ? offset : 0);
        setMsRemaining(displayedMsRemaining => {
            // displayed remaining ms is not updated below 100, only the backend sets it below 0 ms
            if (displayedMsRemaining !== null && displayedMsRemaining > 1100) {
                return Math.max(diff, 100)
            }
            // if it is set below 0 we can continue the normal operation
            if (displayedMsRemaining !== null && displayedMsRemaining < 0) {
              return diff;
            }
            // when displayed ms remaining is between 1100 and 0 sync with server timer
            getServerTimer();
            return displayedMsRemaining;
        });
    });
    // A new server reading restarts the timer, so the first tick after it is a
    // full second later.
    useEffect(() => {
        const handle = setInterval(tick, 1000);
        return () => clearInterval(handle);
    }, [clock]);

    return (<><span className="fs-3 mb-3"><code className="mb-2">
        {msRemaining === null ? "??:??:??" : formatCountdown(msRemaining)}
    </code></span>
    {(offset > 5000 || offset < -5000) && <Tooltip title={t('general.warning.timeNotMatch')}><ReportIcon color="warning"/></Tooltip>}</>);
}

function measureClock(endMs: number, serverRemainingMs: number) {
    return { endMs, serverRemainingMs, offset: endMs - new Date().getTime() - serverRemainingMs };
}

function formatCountdown(msRemaining: number) {
    // add some seconds: the server is the single point of truth, do not let the frontend
    // stop the player from submitting!
    if (msRemaining <= 0 && msRemaining > -5000) {
        return "00:00:00";
    }
    if (msRemaining <= -10000) {
        return "XX:XX:XX";
    }
    return `${Math.floor(msRemaining / 3600 / 1000).toString().padStart(2, '0')
        }:${(Math.floor(msRemaining / 60 / 1000) % 60).toString().padStart(2, '0')
        }:${Math.floor(msRemaining / 1000 % 60).toString().slice(0, 2).padStart(2, '0')
        }`;
}
