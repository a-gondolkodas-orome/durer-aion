import { Button } from '@mui/material';
import { Stack } from '@mui/system';
import { MatchStatus, FinishedMatchStatus } from '../dto/TeamStateDto';
import { useStartRelay, useStartStrategy } from '../hooks/user-hooks';
import { formatTime } from '../utils/DateFormatter';
import { dictionary } from '../text-constants';

export function ChooserItem(props: {
  status: MatchStatus,
  type: 'strategy'|'relay',
  setState: React.Dispatch<"R" | "S" | null> 
  hideDesc?: boolean
}) {
  const startRelay = useStartRelay();
  const startStrategy = useStartStrategy();

  return (
    <Stack sx={{
      display: 'flex',
      width: 'calc(50% - 50px)',
      padding: "40px",
      backgroundColor: "#fff",
    }}>
      <Stack sx={{
        fontWeight: 'bold',
        fontSize: 24,
        textAlign: 'center',
      }}>
        {props.type==='relay' ? dictionary.relay.name : dictionary.strategy.name}
      </Stack>
      {props.status.state === "FINISHED" &&
        <Stack sx={{
          height: 24,
          fontSize: 18,
          textAlign: 'center',
        }}>
          {dictionary.chooser.filledAt}: {formatTime((props.status as FinishedMatchStatus).startAt)} - {formatTime((props.status as FinishedMatchStatus).endAt)} {dictionary.chooser.achievedPoint}: {(props.status as FinishedMatchStatus).score}
        </Stack>
      }
      {props.type === 'relay' &&
        <Stack sx={{
          fontSize: 14,
          height: "100%",
          display: 'flex',
          alignItems: "center",
          flexDirection: 'row',
        }}>
          <Stack>
            {!props.hideDesc && dictionary.chooser.relayDescription}
          </Stack>
        </Stack>
      }        
      {props.type === 'strategy' &&
        <Stack sx={{
          fontSize: 14,
          height: "100%",
          paddingBottom: "10px",
          "& p": {
            marginBlockEnd: 0,
          },
        }}>
          {!props.hideDesc && <span dangerouslySetInnerHTML={{ __html: dictionary.chooser.gameDescriptionHtml }}/>}
        </Stack>
      }  
      <Button sx={{
        width: '100%',
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
      <Button sx={{
        width: '70%',
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
    </Stack>
  )
}