import { Dispatch, PropsWithoutRef, SetStateAction, useEffect, useState } from "react";

export function Countdown(
  props: PropsWithoutRef<{ 
    msRemaining: number | null,
    setMsRemaining: Dispatch<SetStateAction<number>>,
    endTime: Date,
    getServerTimer: ()=>void 
  }>
) {
    const [countdown, setCountdown] = useState("??:??:??");
    // initializes a timer. Note that it does not need updates, even though it "uses" secondsRemaining
    useEffect(() => {
        let handle: NodeJS.Timeout | null = null;
        handle = setInterval(function () {
            const now = new Date();
            const end = new Date(props.endTime);
            const diff = end.getTime() - now.getTime();
            props.setMsRemaining(s => {
                // clock is not updated below 1 seconds, only the backend sets it below 1 second!
                if (s !== null && s > 1100) {
                    return diff
                }
                if (s !== null && s < 0) {
                  return diff;
                }
                props.getServerTimer();
                // TODO: fetch / something
                return s;
            });
        }, 1000);
        return () => { // cleanup
          if (handle !== null) {
              clearInterval(handle);
          }
          handle = null;
      };
    }, []);

    useEffect(() => {
        if (props.msRemaining === null) {
            return;
        }
        // add some seconds: the server is the single point of truth, do not let the frontend
        // stop the player from submitting!
        if (props.msRemaining <= 0 && props.msRemaining > -5000) {
          setCountdown("00:00:00");
            /*setCountdown(`${Math.ceil(props.msRemaining / 3600 / 1000).toString().padStart(2, '0')
          }:${(Math.ceil(props.msRemaining / 60 / 1000) % 60).toString().padStart(2, '0')
          }:${(props.msRemaining / 1000 % 60).toString().slice(0,2).padStart(2, '0')
          }`);*/
        } else if (props.msRemaining <= -10000) {
            setCountdown("XX:XX:XX");
            // cleanup(); ???
        } else {
            setCountdown(`${Math.floor(props.msRemaining / 3600 / 1000).toString().padStart(2, '0')
                }:${(Math.floor(props.msRemaining / 60 / 1000) % 60).toString().padStart(2, '0')
                }:${Math.floor(props.msRemaining / 1000 % 60).toString().slice(0,2).padStart(2, '0')
                }`);
        }
    }, [props.msRemaining, props.endTime]);
    return (<span className="fs-3 mb-3"><code className="mb-2">
        {countdown}
    </code></span>);
}