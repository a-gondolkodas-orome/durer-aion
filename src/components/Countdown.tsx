import { Dispatch, PropsWithoutRef, SetStateAction, useEffect, useState } from "react";

export function Countdown(props: PropsWithoutRef<{ secondsRemaining: number | null, setSecondsRemaining: Dispatch<SetStateAction<number | null>>, getServerTimer: ()=>void }>) {
    const [countdown, setCountdown] = useState("??:??:??");
    // initializes a timer. Note that it does not need updates, even though it "uses" secondsRemaining
    useEffect(() => {
        let handle: NodeJS.Timeout | null = null;
        handle = setInterval(function () {
            props.setSecondsRemaining(s => {
                // clock is not updated below 1 seconds, only the backend sets it below 1 second!
                if (s !== null && s > 1) {
                    return s - 1000
                }
                props.getServerTimer();
                // TODO fetch / something
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
        if (props.secondsRemaining === null) {
            return;
        }
        // add some seconds: the server is the single point of truth, do not let the frontend
        // stop the player from submitting!
        if (props.secondsRemaining <= 0 && props.secondsRemaining > -10000) {
            setCountdown(`${Math.ceil(props.secondsRemaining / 3600 / 1000).toString().padStart(2, '0')
          }:${(Math.ceil(props.secondsRemaining / 60 / 1000) % 60).toString().padStart(2, '0')
          }:${(props.secondsRemaining / 1000 % 60).toString().slice(0,2).padStart(2, '0')
          }`);
        } else if (props.secondsRemaining <= -10000) {
            setCountdown("XX:XX:XX");
            // cleanup(); ???
        } else {
            setCountdown(`${Math.floor(props.secondsRemaining / 3600 / 1000).toString().padStart(2, '0')
                }:${(Math.floor(props.secondsRemaining / 60 / 1000) % 60).toString().padStart(2, '0')
                }:${Math.floor(props.secondsRemaining / 1000 % 60).toString().slice(0,2).padStart(2, '0')
                }`);
        }
    }, [props.secondsRemaining]);
    return (<span className="fs-3 mb-3"><code className="mb-2">
        {countdown}
    </code></span>);
}