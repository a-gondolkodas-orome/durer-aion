import { Box, Button, IconButton } from '@mui/material';
import type { ReactNode } from 'react';
import { Stack } from '@mui/system';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { MatchStatus } from '../dto/TeamStateDto';
import { useStartRelay, useStartStrategy } from '../hooks/user-hooks';
import { formatTime } from '../utils/DateFormatter';
import { useId, useState } from 'react';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useTheme } from "@mui/material/styles";
import { useTranslation, Trans } from 'react-i18next';
import { RELAY_MAX_TRIES, STRATEGY_POINTS_BY_LOSSES, strategyPoints } from 'game';
import { RelayKey, RelayResultsTable, ScoreHeadline, StrategyGamesTable, StrategyOutcome, StrategyPointsExamples } from './ResultTables';
import type { PublicCompetition } from 'schemas';
import { relayMaxPoints } from './relay-results';
import { relayNumbers, strategyMinutes } from './round-numbers';
import { cardButtonSx, cardSx, cardTokens } from './card';

/**
 * One round on the home page: its rules and the button that starts it, or once
 * it is over, its results in full and when it was filled in.
 */
export function ChooserItem(props: {
  status: MatchStatus,
  type: 'strategy' | 'relay',
  /// The numbers its rules tell come from here; the local apps have none.
  competition?: PublicCompetition | null,
  /// False outside the team's start window, when the server refuses a start.
  canStart?: boolean,
}) {
  const startRelay = useStartRelay();
  const startStrategy = useStartStrategy();

  const [mobileDescOpen, setMobileDescOpen] = useState(true);
  const descId = useId();
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
      ...cardSx(theme),
      flex: 1,
      minWidth: 0,
      gap: '16px',
    }}>
      <Stack direction="row" sx={{
        alignItems: 'center',
        gap: '12px',
        cursor: { xs: showDesc ? 'pointer' : 'default', md: 'default' },
      }}
      onClick={() => {
        setMobileDescOpen((prev) => {
          return !prev
        })
      }}>
        <Box sx={{ flex: 1, fontWeight: 700, fontSize: 22, lineHeight: 1.2 }}>
          {props.type === 'relay' ? t('relay.name') : t('strategy.name')}
        </Box>
        {/* The row takes a tap anywhere; this is the same toggle for a keyboard
            and a screen reader. It has no handler of its own: its click bubbles
            to the row's. */}
        {showDesc &&
          <IconButton aria-expanded={mobileDescOpen} aria-controls={descId}
            aria-label={props.type === 'relay' ? t('relay.name') : t('strategy.name')}
            sx={{ display: { md: 'none' }, color: 'inherit', marginRight: '-8px' }}>
            {mobileDescOpen ? <KeyboardArrowUpIcon sx={{ fontSize: 30 }}/> : <KeyboardArrowDownIcon sx={{ fontSize: 30 }}/>}
          </IconButton>}
      </Stack>
      {finished &&
        <Stack sx={{ gap: '16px' }}>
          {props.type === 'relay'
            ? <>
              <ScoreHeadline compact points={finished.score} max={finished.relayResults && relayMaxPoints(finished.relayResults)}/>
              {finished.relayResults && <>
                <Stack sx={{ gap: '10px' }}>
                  <RelayResultsTable problems={finished.relayResults} details transposeOnPhone/>
                  <RelayKey centred/>
                </Stack>
              </>}
            </>
            : <>
              <ScoreHeadline compact points={finished.score} max={strategyPoints(0)}/>
              {finished.strategyResults && <>
                <StrategyGamesTable results={finished.strategyResults} points={finished.score}/>
                <StrategyOutcome results={finished.strategyResults} points={finished.score}/>
              </>}
            </>}
          <Stack sx={{ fontSize: '13px', color: '#666', textAlign: 'center' }}>
            {t('chooser.filledAt')}: {formatTime(finished.startAt)} – {formatTime(finished.endAt)}
          </Stack>
        </Stack>
      }
      {showDesc && <>
        <Stack id={descId} sx={{
          fontSize: 14,
          color: cardTokens(theme).bodyText,
          visibility: { xs: mobileDescOpen ? 'visible' : 'hidden', md: 'visible' },
          height: {
            xs: mobileDescOpen ? "100%" : "0px",
            md: "100%",
          },
          transition: "height 0.2s ease-in",
          overflow: 'hidden',
          marginTop: { xs: mobileDescOpen ? 0 : '-16px', md: 0 },
          "& p": {
            marginBlockStart: 0,
            marginBlockEnd: 0,
          },
        }}>
          {props.type === 'relay'
            ? <RelayDescription competition={props.competition} />
            : <StrategyDescription competition={props.competition} />}
        </Stack>
        <Button sx={{
          width: '100%',
          maxWidth: "600px",
          ...cardButtonSx(theme),
          marginTop: 'auto',
          alignSelf: 'center',
        }} variant='contained' color='primary' disableElevation endIcon={<ArrowForwardRounded />} onClick={() => {
          setStarting(true);
          void (props.type === "relay" ? startRelay() : startStrategy()).finally(() => setStarting(false));
        }} disabled={starting || props.status.state !== "NOT STARTED" || props.canStart === false}>
          {t('chooser.start')}
        </Button>
      </>}
    </Stack>
  )
}

const BOLD = { b: <b /> };

/// A round before it starts, the one place it is explained before the clock
/// runs: a line per point, and under a point that needs one, a quieter line
/// explaining it. Nothing is behind a tooltip: every rule here is one a team
/// has to know before it starts. Both rounds are told alike, so a team
/// reading one knows where to look in the other.
function Description(props: { children: ReactNode }) {
  return <Box sx={{ '& li': { margin: '6px 0' } }}>{props.children}</Box>;
}

function Hint(props: { children: ReactNode }) {
  return <Box component="span" sx={{ display: 'block', marginTop: '3px', fontSize: '12.5px', fontStyle: 'italic', lineHeight: 1.45, color: '#6e7781' }}>
    {props.children}
  </Box>;
}

// Spelled out key by key in both: the i18n check finds a key only as a literal.
// The wording and the lines are the translations'; these only fill in numbers.
function RelayDescription(props: { competition?: PublicCompetition | null }) {
  const { t } = useTranslation();
  const { minutes, total, min, max } = relayNumbers(props.competition);
  const tries = RELAY_MAX_TRIES;
  return (
    <Description>
      <p>{t('chooser.relay.intro')}</p>
      <ul>
        <li><Trans i18nKey='chooser.relay.points' components={BOLD} values={{ total, min, max }} /></li>
        <li>
          <Trans i18nKey='chooser.relay.tries' components={BOLD} values={{ tries }} />
          <Hint>{t('chooser.relay.triesHint', { tries })}</Hint>
        </li>
        <li><Trans i18nKey='chooser.relay.time' components={BOLD} values={{ minutes }} /></li>
        <li>{t('chooser.relay.noReturn')}</li>
      </ul>
    </Description>
  );
}

function StrategyDescription(props: { competition?: PublicCompetition | null }) {
  const { t } = useTranslation();
  const minutes = strategyMinutes(props.competition);
  return (
    <Description>
      <p>{t('chooser.strategy.intro')}</p>
      <ul>
        <li>
          <Trans i18nKey='chooser.strategy.live' components={BOLD}
            values={{ max: STRATEGY_POINTS_BY_LOSSES[0], next: STRATEGY_POINTS_BY_LOSSES[1], rest: STRATEGY_POINTS_BY_LOSSES.slice(2).join(', ') }} />
          <Hint><StrategyPointsExamples /></Hint>
        </li>
        <li>
          <Trans i18nKey='chooser.strategy.practice' components={BOLD} />
          <Hint>{t('chooser.strategy.practiceHint')}</Hint>
        </li>
        <li><Trans i18nKey='chooser.strategy.time' components={BOLD} values={{ minutes }} /></li>
        <li>{t('chooser.strategy.noAbandon')}</li>
      </ul>
    </Description>
  );
}
