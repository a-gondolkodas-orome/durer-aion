import { Button } from '@mui/material';
import { Stack, alpha } from '@mui/system';
import { MatchStatus, FinishedMatchStatus } from '../dto/TeamStateDto';
import { useStartRelay, useStartStrategy } from '../hooks/user-hooks';
import { formatTime } from '../utils/DateFormatter';
import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useClientRepo } from '../api-repository-interface';
import { useTheme } from "@mui/material/styles";
import { useTranslation, Trans } from 'react-i18next';

export function ChooserItem(props: {
  status: MatchStatus,
  type: 'strategy'|'relay',
  setState: React.Dispatch<"R" | "S" | null> 
  hideDesc?: boolean
}) {
  const startRelay = useStartRelay();
  const startStrategy = useStartStrategy();

  const [mobileDescOpen, setMobileDescOpen] = useState(props.status.state !== "FINISHED");
  const isOffline = useClientRepo().version === "OFFLINE";
  const theme = useTheme();
  const { t } = useTranslation(undefined, { keyPrefix: 'chooser' });

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
      backgroundColor: alpha(theme.palette.background.paper, theme.palette.background.paperOpacity),
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
        <span>{props.type==='relay' ? t('name', { keyPrefix: 'relay' }) : t('name', { keyPrefix: 'strategy' })}  {!props.hideDesc && <ExpandMoreIcon sx={{
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
          {t('filledAt')}: {formatTime((props.status as FinishedMatchStatus).startAt)} - {formatTime((props.status as FinishedMatchStatus).endAt)} {t('achievedPoint')}: {(props.status as FinishedMatchStatus).score}
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
            {!props.hideDesc && t('relayDescription')}
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
          {!props.hideDesc && 
          <Trans
            i18nKey='chooser.gameDescriptionHtml'
            components={{
              b: <b />,
              p: <p />,
              ul: <ul />,
              li: <li />
            }}
          />}
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
        {t('start')}
      </Button>
      { !isOffline &&
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
        {t('result')}
      </Button>
      }
    </Stack>
  )
}