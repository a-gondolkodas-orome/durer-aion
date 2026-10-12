import { Button } from '@mui/material';
import { Stack, alpha } from '@mui/system';
import { MatchStatus } from '../dto/TeamStateDto';
import { useStartRelay, useStartStrategy } from '../hooks/user-hooks';
import { formatTime } from '../utils/DateFormatter';
import { useState } from 'react';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useTheme } from "@mui/material/styles";
import { useTranslation, Trans } from 'react-i18next';
import { strategyPoints } from 'game';
import { RelayResultsTable, ScoreHeadline, StrategyGamesTable } from './ResultTables';
import { relayMaxPoints } from './relay-results';
import { EndDialog } from './EndCard';
import { RelayEndTable } from './RelayEndTable';
import { StrategyEndTable } from './StrategyEndTable';

export function ChooserItem(props: {
  status: MatchStatus,
  type: 'strategy' | 'relay',
  hideDesc?: boolean
}) {
  const startRelay = useStartRelay();
  const startStrategy = useStartStrategy();

  const [mobileDescOpen, setMobileDescOpen] = useState(props.status.state !== "FINISHED");
  const theme = useTheme();
  const { t } = useTranslation();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const closeDetails = () => setDetailsOpen(false);
  // The round's end screen, from the summary saved with the finished match. A
  // match without one has nothing to show: a record from before the summary
  // existed, or a local relay left to run out of time (#613).
  const finished = props.status.state === "FINISHED" ? props.status : null;
  const details = props.type === 'relay'
    ? finished?.relayResults && <RelayEndTable allPoints={finished.score} problems={finished.relayResults} onClose={closeDetails}/>
    : finished?.strategyResults && <StrategyEndTable allPoints={finished.score} liveResults={finished.strategyResults} onClose={closeDetails}/>;

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
      onClick={() => {
        setMobileDescOpen((prev) => {
          return !prev
        })
      }}>
        <span>{props.type === 'relay' ? t('relay.name') : t('strategy.name')}  {!props.hideDesc && (mobileDescOpen ? <KeyboardArrowUpIcon sx={{
          fontSize: 33,
          marginBottom: "-9px",
          display: {
            md: 'none',
          }
        }}/> : <KeyboardArrowDownIcon sx={{
          fontSize: 33,
          marginBottom: "-9px",
          display: {
            md: 'none',
          }
        }}/>)}</span>
      </Stack>
      {finished &&
        <Stack sx={{ gap: '12px', marginBottom: { xs: '10px', md: '16px' } }}>
          {props.type === 'relay'
            ? <>
              <ScoreHeadline compact points={finished.score} max={finished.relayResults && relayMaxPoints(finished.relayResults)}/>
              {finished.relayResults && <RelayResultsTable problems={finished.relayResults}/>}
            </>
            : <>
              <ScoreHeadline compact points={finished.score} max={strategyPoints(0)}/>
              {finished.strategyResults && <StrategyGamesTable results={finished.strategyResults}/>}
            </>}
          <Stack sx={{ fontSize: '13px', color: '#666', textAlign: 'center' }}>
            {t('chooser.filledAt')}: {formatTime(finished.startAt)} – {formatTime(finished.endAt)}
          </Stack>
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
          <Stack sx={{ marginTop: {
            md: 0,
            xs: '10px'
          } }}>
            {!props.hideDesc && t('chooser.relayDescription')}
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
      }} variant='contained' color='primary' onClick={() => {
        if (props.type === "relay") {
          void startRelay()
        } else {
          void startStrategy()
        }
      }} disabled={props.status.state !== "NOT STARTED"}>
        {props.status.state === "FINISHED" ? t('chooser.finished') : t('chooser.start')}
      </Button>
      <Button sx={{
        width: '70%',
        maxWidth: "400px",
        height: '50px',
        fontSize: '16px',
        alignSelf: 'center',
        textTransform: 'none',
        marginTop: '15px',
      }} variant='contained' color='primary' onClick={() => setDetailsOpen(true)} disabled={!details}>
        {t('chooser.detailedResults')}
      </Button>
      {details && <EndDialog open={detailsOpen} onClose={closeDetails}>{details}</EndDialog>}
    </Stack>
  )
}
