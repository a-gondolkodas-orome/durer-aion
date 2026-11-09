import { Box, Button, IconButton, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { ReactNode } from 'react';
import { Stack, alpha } from '@mui/system';
import { MatchStatus } from '../dto/TeamStateDto';
import { useStartRelay, useStartStrategy } from '../hooks/user-hooks';
import { formatTime } from '../utils/DateFormatter';
import { useState } from 'react';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useTheme } from "@mui/material/styles";
import { useTranslation, Trans } from 'react-i18next';
import { STRATEGY_POINTS_BY_LOSSES, strategyPoints } from 'game';
import { PointsScale, RelayResultsTable, ScoreHeadline, StrategyGamesTable, StrategyPointsRule } from './ResultTables';
import { relayMaxPoints } from './relay-results';

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
          {props.type === 'relay' ? <RelayDescription /> : <StrategyDescription />}
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

const BOLD = { b: <b /> };

/// A round before it starts, the one place it is explained before the clock
/// runs: a line per point, the details behind an ⓘ beside it. Both rounds are
/// told alike, so a team reading one knows where to look in the other.
function Description(props: { children: ReactNode }) {
  return <Box sx={{ '& li': { margin: '6px 0' } }}>{props.children}</Box>;
}

// Spelled out key by key in both: the i18n check finds a key only as a literal.
function RelayDescription() {
  const { t } = useTranslation();
  return (
    <Description>
      <p>{t('chooser.relay.intro')}</p>
      <ul>
        <li>
          <Trans i18nKey='chooser.relay.points' components={BOLD} />
          <InfoTip label={t('chooser.relay.pointsLabel')}>{t('chooser.relay.pointsTip')}</InfoTip>
        </li>
        <li>
          <Trans i18nKey='chooser.relay.tries' components={BOLD} />
          <InfoTip label={t('chooser.relay.triesLabel')}>{t('chooser.relay.triesTip')}</InfoTip>
        </li>
        <li><Trans i18nKey='chooser.relay.time' components={BOLD} /></li>
        <li>{t('chooser.relay.noReturn')}</li>
      </ul>
    </Description>
  );
}

function StrategyDescription() {
  const { t } = useTranslation();
  return (
    <Description>
      <p>{t('chooser.strategy.intro')}</p>
      <ul>
        <li>
          <Trans i18nKey='chooser.strategy.live' components={BOLD}
            values={{ max: STRATEGY_POINTS_BY_LOSSES[0], next: STRATEGY_POINTS_BY_LOSSES[1], rest: STRATEGY_POINTS_BY_LOSSES.slice(2).join(', ') }} />
          <InfoTip label={t('chooser.strategy.pointsLabel')}><StrategyPointsRule /></InfoTip>
        </li>
        <li>
          <Trans i18nKey='chooser.strategy.practice' components={BOLD} />
          <InfoTip label={t('chooser.strategy.practiceLabel')}>{t('chooser.strategy.practiceTip')}</InfoTip>
        </li>
        <li>
          <Trans i18nKey='chooser.strategy.time' components={BOLD} />
          <InfoTip label={t('chooser.strategy.timeLabel')}>{t('chooser.strategy.timeTip')}</InfoTip>
        </li>
        <li>{t('chooser.strategy.noAbandon')}</li>
      </ul>
    </Description>
  );
}

/// Details behind an ⓘ. A tap opens it on a phone, and keeps it open long
/// enough to read.
function InfoTip(props: { label: string, children: ReactNode }) {
  return (
    <Tooltip arrow enterTouchDelay={0} leaveTouchDelay={10000}
      title={<Box sx={{ fontSize: '14px', lineHeight: 1.45, padding: '4px' }}>{props.children}</Box>}>
      <IconButton size="small" aria-label={props.label} sx={{ padding: '2px', marginLeft: '4px', verticalAlign: '-4px', color: '#57606a' }}>
        <InfoOutlinedIcon sx={{ fontSize: '18px' }} />
      </IconButton>
    </Tooltip>
  );
}
