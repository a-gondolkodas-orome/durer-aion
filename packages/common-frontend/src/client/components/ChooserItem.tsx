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
import { PointsScale, RelayResultsTable, ScoreHeadline, StrategyGamesTable } from './ResultTables';
import { relayMaxPoints } from './relay-results';

const DESCRIPTION_TAGS = { b: <b />, p: <p />, ul: <ul />, li: <li /> };

/**
 * One round on the home page: its rules and the button that starts it, or once
 * it is over, its results in full and when it was filled in.
 */
export function ChooserItem(props: {
  status: MatchStatus,
  type: 'strategy' | 'relay',
}) {
  const startRelay = useStartRelay();
  const startStrategy = useStartStrategy();

  const [mobileDescOpen, setMobileDescOpen] = useState(true);
  const theme = useTheme();
  const { t } = useTranslation();
  // The status changes only once the start has answered; until then a second
  // click would send a second start.
  const [starting, setStarting] = useState(false);
  // The summary saved with the finished match may be missing: for example a
  // record from before the summary existed, or a local relay left to run out
  // of time (#613). The score and the time are still known.
  const finished = props.status.state === "FINISHED" ? props.status : null;
  const showDesc = !finished;

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
        <span>{props.type === 'relay' ? t('relay.name') : t('strategy.name')}  {showDesc && (mobileDescOpen ? <KeyboardArrowUpIcon sx={{
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
        <Stack sx={{ gap: '16px' }}>
          {props.type === 'relay'
            ? <>
              <ScoreHeadline compact points={finished.score} max={finished.relayResults && relayMaxPoints(finished.relayResults)}/>
              {finished.relayResults && <RelayResultsTable problems={finished.relayResults} details transposeOnPhone/>}
            </>
            : <>
              <ScoreHeadline compact points={finished.score} max={strategyPoints(0)}/>
              {finished.strategyResults && <StrategyGamesTable results={finished.strategyResults}/>}
              <PointsScale points={finished.score}/>
            </>}
          <Stack sx={{ fontSize: '13px', color: '#666', textAlign: 'center' }}>
            {t('chooser.filledAt')}: {formatTime(finished.startAt)} – {formatTime(finished.endAt)}
          </Stack>
        </Stack>
      }
      {showDesc && <>
        <Stack sx={{
          fontSize: 14,
          height: {
            xs: mobileDescOpen ? "100%" : "0px",
            md: "100%",
          },
          transition: "height 0.2s ease-in",
          overflow: 'hidden',
          paddingBottom: {
            xs: mobileDescOpen ? "10px" : "0px",
            md: "0px",
          },
          "& p": {
            marginBlockEnd: 0,
          },
        }}>
          {/* Spelled out key by key: the i18n check finds a key only as a literal. */}
          {props.type === 'relay'
            ? <Trans i18nKey='chooser.relayDescriptionHtml' components={DESCRIPTION_TAGS}/>
            : <Trans i18nKey='chooser.gameDescriptionHtml' components={DESCRIPTION_TAGS}/>}
        </Stack>
        <Button sx={{
          width: '100%',
          maxWidth: "600px",
          height: '75px',
          fontSize: '26px',
          alignSelf: 'center',
          textTransform: 'none',
        }} variant='contained' color='primary' onClick={() => {
          setStarting(true);
          void (props.type === "relay" ? startRelay() : startStrategy()).finally(() => setStarting(false));
        }} disabled={starting || props.status.state !== "NOT STARTED"}>
          {t('chooser.start')}
        </Button>
      </>}
    </Stack>
  )
}
