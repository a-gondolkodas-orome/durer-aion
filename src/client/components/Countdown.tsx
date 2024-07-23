import { Dispatch, PropsWithoutRef, SetStateAction, useEffect, useState } from "react";
import ReportIcon from '@mui/icons-material/Report';
import { Tooltip } from "@mui/material";
import { dictionary } from '../text-constants';

export function Countdown(
  props: PropsWithoutRef<{ 
    msRemaining: number | null,
    setMsRemaining: Dispatch<SetStateAction<number>>,
    endTime: Date,
    getServerTimer: ()=>void,
    serverRemainingMs: number;
  }>
) {
    const {msRemaining, setMsRemaining, endTime, getServerTimer, serverRemainingMs} = props
    const [countdown, setCountdown] = useState("??:??:??");
    const [offset, setOffset] = useState(0); // to show warning icon
    // initializes a timer. Note that it does not need updates, even though it "uses" secondsRemaining
    useEffect(() => {
        let handle: NodeJS.Timeout | null = null;
        const offsetInit = new Date(endTime).getTime() - new Date().getTime() - serverRemainingMs;
        setOffset(offsetInit);
        handle = setInterval(function () {
            const now = new Date();
            const end = new Date(endTime);
            const diff = end.getTime() - now.getTime() - (offsetInit > 5000 || offsetInit < -5000 ? offsetInit : 0);
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
        }, 1000);
        return () => { // cleanup
          if (handle !== null) {
              clearInterval(handle);
          }
          handle = null;
      };
    }, [setMsRemaining, endTime, getServerTimer, serverRemainingMs]);

    useEffect(() => {
        if (msRemaining === null) {
            return;
        }
        // add some seconds: the server is the single point of truth, do not let the frontend
        // stop the player from submitting!
        if (msRemaining <= 0 && msRemaining > -5000) {
          setCountdown("00:00:00");
        } else if (msRemaining <= -10000) {
            setCountdown("XX:XX:XX");
        } else {
            setCountdown(`${Math.floor(msRemaining / 3600 / 1000).toString().padStart(2, '0')
                }:${(Math.floor(msRemaining / 60 / 1000) % 60).toString().padStart(2, '0')
                }:${Math.floor(msRemaining / 1000 % 60).toString().slice(0,2).padStart(2, '0')
                }`);
        }
    }, [msRemaining, endTime]);
    return (<><span className="fs-3 mb-3"><code className="mb-2">
        {countdown}
    </code></span>
    {(offset > 5000 || offset < -5000) && <Tooltip title={dictionary.warnings.timeNotMatch}><ReportIcon color="warning"/></Tooltip>}</>);
}