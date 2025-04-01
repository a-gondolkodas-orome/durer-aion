import { Button } from '@mui/material';
import { Stack } from '@mui/system';
import { MatchStatus, FinishedMatchStatus } from '../dto/TeamStateDto';
import { useStartRelay, useStartStrategy } from '../hooks/user-hooks';
import { formatTime } from '../utils/DateFormatter';
import { dictionary } from '../text-constants';
import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { isOnlineMode } from '../utils/appMode';

export function ChooserItem(props: {
  status: MatchStatus,
  type: 'strategy'|'relay',
  setState: React.Dispatch<"R" | "S" | null> 
  hideDesc?: boolean
}) {
  const startRelay = useStartRelay();
  const startStrategy = useStartStrategy();

  const [mobileDescOpen, setMobileDescOpen] = useState(props.status.state !== "FINISHED");

  return (
    <Stack sx={{
      display: 'flex',
      width: {
        xs: '100%',
        md: 'calc(50% - 50px)',
      },
      padding: {
        xs: "10px",
        md: "40px",
      },
      backgroundColor: "#fff",
    }}>
      <Stack sx={{
        fontWeight: 'bold',
        fontSize: 24,
        textAlign: 'center',
        paddingBottom: {
          xs: '10px',
          md: 0,
        }
      }}
      onClick={()=>{
        setMobileDescOpen((prev)=> {
          return !prev
        })
      }}>
        <span>{props.type==='relay' ? dictionary.relay.name : dictionary.strategy.name}  {!props.hideDesc && <ExpandMoreIcon sx={{
          fontSize: 33,
          marginBottom: "-9px",
          display: {
            md: 'none',
          }
        }}/>}</span>
      </Stack>
      {props.status.state === "FINISHED" &&
        <Stack sx={{
          height: 24,
          fontSize: 18,
          textAlign: 'center',
          marginBottom: {
            xs: '10px',
            md: 0,
          }
        }}>
          {dictionary.chooser.filledAt}: {formatTime((props.status as FinishedMatchStatus).startAt)} - {formatTime((props.status as FinishedMatchStatus).endAt)} {dictionary.chooser.achievedPoint}: {(props.status as FinishedMatchStatus).score}
        </Stack>
      }
      {props.type === 'relay' &&
        <Stack sx={{
          fontSize: 14,
          height: {
            xs: !props.hideDesc && mobileDescOpen ? "100%" : "0px",
            md: "100%",
          },
          transition: "height 0.2s ease-in",
          overflow: 'hidden',
          display: 'flex',
          alignItems: "center",
          flexDirection: 'row',
          paddingBottom: {
            xs: !props.hideDesc && mobileDescOpen ? "10px" : "0px",
            md: "0px",
          },
        }}>
          <Stack sx={{marginTop: {
            md: 0,
            xs: '10px'
          }}}>
            {!props.hideDesc && dictionary.chooser.relayDescription}
          </Stack>
        </Stack>
      }        
      {props.type === 'strategy' &&
        <Stack sx={{
          fontSize: 14,
          height: {
            xs: !props.hideDesc && mobileDescOpen ? "100%" : "0px",
            md: "100%",
          },
          transition: "height 0.2s ease-in",
          overflow: 'hidden',
          paddingBottom: {
            xs: !props.hideDesc && mobileDescOpen ? "10px" : "0px",
            md: "0px",
          },
          "& p": {
            marginBlockEnd: 0,
          },
        }}>
          {!props.hideDesc && <span dangerouslySetInnerHTML={{ __html: dictionary.chooser.gameDescriptionHtml }}/>}
        </Stack>
      }
      <Button sx={{
        width: '100%',
        maxWidth: "600px",
        height: '75px',
        fontSize: '26px',
        alignSelf: 'center',
        textTransform: 'none',
      }} variant='contained' color='primary' onClick={()=>{
        if (props.type === "relay") {
          startRelay()
        } else {
          startStrategy()
        }
      }} disabled={props.status.state !== "NOT STARTED"}>
        {dictionary.chooser.start}
      </Button>
      {isOnlineMode() &&
      <Button sx={{
        width: '70%',
        maxWidth: "400px",
        height: '50px',
        fontSize: '16px',
        alignSelf: 'center',
        textTransform: 'none',
        marginTop: '15px',
      }} variant='contained' color='primary' onClick={()=>{
        if (props.type === "relay") {
          props.setState("R");
        } else {
          props.setState("S");
        }
      }} disabled={props.status.state === "NOT STARTED"}>
        {dictionary.chooser.result}
      </Button>
      }
    </Stack>
  )
}