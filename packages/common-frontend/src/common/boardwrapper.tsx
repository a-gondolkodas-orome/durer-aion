import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Tooltip, alpha, useMediaQuery } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import { useEffect, useMemo, useRef, useState } from "react";
import { Countdown, ENDED_CLOCK, OfflineClockNote, useMsRemaining } from "../client/components/Countdown";
import { EndDialog } from "../client/components/EndCard";
import { StrategyEndTable } from "../client/components/StrategyEndTable";
import { LiveGameCell, LiveGameRun } from "../client/components/ResultTables";
import { useBackToHome } from "../client/hooks/user-hooks";
import { useClientRepo } from "../client/client-repo-context";
import { asStrategyWrapperMoves } from "../client/match-moves";
import type { StrategyWrapperMoves } from "../client/match-moves";
import { GUESSER_PLAYER, JUDGE_PLAYER, STRATEGY_POINTS_BY_LOSSES, strategyPoints } from "game";
import type { Difficulty, GameStateMixin } from "game";
import type { LiveGameResult } from "schemas";
import type { BoardProps } from "boardgame.io/react";
import type { MouseEvent, ReactNode } from "react";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { inLanguage, type Localizable } from "schemas";
import { useUiLanguage } from "../client/hooks/ui-language";

/// What boardgame.io hands a strategy game's board: the game's own state as
/// gameWrapper extends it, plus the client API. The wrapper passes its props
/// through untouched, so a board may read anything bgio put there.
export type StrategyBoardProps<G> = BoardProps<G & GameStateMixin>;
export type StrategyBoard<G> = (props: StrategyBoardProps<G>) => ReactNode;

/// A game's rules text, one for every language or one per language; the board
/// shows the page's.
export type StrategyDescription = Localizable<ReactNode>;

/// What the wrapper shows around a game's board that only the game knows.
export interface StrategyPresentation {
  /// The rules: in a dialog before the first game, behind a button after it.
  rules: StrategyDescription,
  /// The role buttons, the first player's first, each one for every language
  /// or one per language. Without them the buttons say only who starts; a game
  /// names its sides here, the marks they play, say.
  roleLabels?: readonly [Localizable<string>, Localizable<string>],
  /// Whether the opening position differs from game to game. Only then do the
  /// texts ask the team to look at it before choosing a role, and say that a
  /// live game may start from another one than practice did.
  startVaries?: boolean,
}

// The screen has a fixed frame, the header strip, and one game area, which is
// all that changes from state to state. The mode's colour is kept to the game
// area's top edge and its mode line; solid against dashed, a filled dot
// against a hollow one, so the mode reads without telling colours apart.
const LIVE = '#c2410c';
const LIVE_DARK = '#9a3412';
const PRACTICE = '#475569';
const PRACTICE_BORDER = '#64748b';
const WIN = '#1b5e20';
const LOSS = '#8e1b10';
const MUTED = '#57606a';
const LINE = '#d0d7de';

/// What the board area shows. `empty` has no position worth reading: no game
/// yet, or the bot still placing the next one. `locked` has one the team needs
/// to see but may not move on: the role depends on the opening position, and a
/// finished game's is its result. `waiting` is the bot's turn, which only
/// ignores clicks: the bot answers within a state update or two, so fading the
/// board on each of its moves would flash it every turn.
type BoardState = 'empty' | 'locked' | 'live' | 'waiting';

/// The status line's colour: the team's turn, a wait, a result, or neither.
type Tone = 'plain' | 'go' | 'wait' | 'won' | 'lost';

const pointsText = (t: TFunction, count: number) => t('general.points', { count });

export function boardWrapper<G>(board: StrategyBoard<G>, presentation: StrategyPresentation) {
  return (props: StrategyBoardProps<G>) => {
    const { G, ctx } = props;
    const moves = useMemo(() => asStrategyWrapperMoves(props.moves), [props.moves]);
    const [msRemaining, setMsRemaining] = useMsRemaining(G.millisecondsRemaining); // asked from the server
    const backToHome = useBackToHome();
    const isOffline = useClientRepo().version === "OFFLINE";
    const theme = useTheme();
    const { t } = useTranslation();
    const language = useUiLanguage();
    const rules = inLanguage<ReactNode>(presentation.rules, language);
    // `noSsr` reads the width on the first render, so the rules do not show
    // in one place and then jump to the other.
    const wide = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
    // Before the first game the rules open in a dialog of their own, which
    // only the team's word that it has read them closes. Once a game has been
    // chosen that has happened, so nothing needs to remember it across a
    // reload.
    const [rulesRead, setRulesRead] = useState(false);
    const [rulesOpen, setRulesOpen] = useState(false);
    // Once the first dialog closes, the button that brings the rules back
    // pulses, so the team sees where they went.
    const [pointToRules, setPointToRules] = useState(false);
    const rulesButtonRef = useRef<HTMLButtonElement>(null);
    const firstRulesRef = useRef<HTMLDivElement>(null);
    // The first dialog flies into the button that brings the rules back, so
    // the team sees where they went; then the button pulses. Where motion is
    // turned down, or there is nothing to animate with, it just closes.
    const closeFirstRules = () => {
      const done = () => { setRulesRead(true); setPointToRules(true); };
      const paper = firstRulesRef.current;
      const target = rulesButtonRef.current;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (!paper || !target || reduced || typeof paper.animate !== 'function') {
        done();
        return;
      }
      const from = paper.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      const scale = Math.max(to.width / from.width, 0.05);
      paper.animate(
        [{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.4 }],
        { duration: 550, easing: 'cubic-bezier(0.55, 0, 0.75, 0.2)', fill: 'forwards' },
      ).finished.then(done, done);
    };

    useEffect(() => {
      if (!ctx.gameover) {
        moves.getTime();
      }
    }, [ctx.gameover, moves]);
    // ctx.gameover is whatever the game passed to events.endGame(); this wrapper
    // only ever asks whether it is `true`.
    const finished = msRemaining < - 5000 || ctx.gameover === true;
    // The judge is the bot, so its turn is a wait rather than a move to offer.
    // It takes one outside `play` too: it sets the opening position of each
    // new game.
    const judgeToMove = ctx.currentPlayer === JUDGE_PLAYER;
    const teamToMove = !judgeToMove && !finished;
    const betweenGames = ctx.phase === 'startNewGame';
    // `difficulty` and `winner` outlive the game they describe until the next
    // one is chosen, so between games they are the last game's mode and result.
    const difficulty = G.difficulty ?? null;
    const lastResult = betweenGames && G.winner !== null ? (G.winner === GUESSER_PLAYER ? 'won' : 'lost') : null;
    const rulesFirst = difficulty === null && !rulesRead && !finished;
    const startVaries = presentation.startVaries === true;

    const nextGame = (
      <>
        <PairButton variant="practice" enabled={teamToMove} onClick={() => moves.chooseNewGameType('test')}>
          {t('strategy.next.practice')}
        </PairButton>
        <PairButton variant="live" enabled={teamToMove} onClick={() => moves.chooseNewGameType('live')}>
          {t('strategy.next.live')}
        </PairButton>
      </>
    );

    // One status line, one row of buttons: what the team does next, and nothing
    // else, always in the same place above the board.
    let status: string;
    let tone: Tone = 'plain';
    let sub = '';
    let actions: ReactNode = null;
    let callout: ReactNode = null;
    let intro: ReactNode = null;
    // The explanation of practice against live sits next to the next-game
    // buttons when they are there, in the corner otherwise.
    let infoBeside = false;
    if (finished) {
      // Two live wins in a row end the match; anything else ending it is the clock.
      if (G.winningStreak >= 2) {
        status = t('strategy.result.liveWon');
        tone = 'won';
      } else {
        status = t('strategy.result.timeUp');
        sub = ctx.phase === 'play' || ctx.phase === 'chooseRole' ? t('strategy.result.unfinished') : '';
      }
    } else if (betweenGames && difficulty === null) {
      status = t('strategy.intro.title');
      intro = <Intro enabled={teamToMove} startVaries={startVaries} moves={moves} />;
    } else if (betweenGames && (judgeToMove || lastResult === null)) {
      status = judgeToMove ? t('strategy.status.starting') : t('strategy.intro.title');
      actions = nextGame;
      infoBeside = true;
    } else if (betweenGames && lastResult !== null) {
      const practice = difficulty === 'test';
      status = practice
        ? (lastResult === 'won' ? t('strategy.result.practiceWon') : t('strategy.result.practiceLost'))
        : (lastResult === 'won' ? t('strategy.result.liveWon') : t('strategy.result.liveLost'));
      tone = lastResult;
      // A first live win is half the task; the strip has the points.
      sub = practice ? t('strategy.result.practiceNote')
        : lastResult === 'won' && G.winningStreak === 1 ? t('strategy.result.liveWonFirst') : '';
      actions = nextGame;
      // Before the first live game the team is about to choose one, so how it
      // may differ from practice comes once, next to its button: after a win,
      // that the practice computer may not have played its best; after a
      // loss that would read oddly, so only a varying start is worth saying.
      // Otherwise, as anywhere else, it is behind the ⓘ.
      if (practice && G.numberOfTries === 0 && (lastResult === 'won' || startVaries)) {
        callout = <LiveHint after={lastResult} startVaries={startVaries} />;
      } else {
        infoBeside = true;
      }
    } else if (ctx.phase === 'chooseRole') {
      status = t('strategy.status.role');
      sub = startVaries ? t('strategy.status.lookAtPosition') : '';
      const [first, second] = presentation.roleLabels
        ? presentation.roleLabels.map(label => inLanguage<string>(label, language))
        : [t('strategy.firstPlayer'), t('strategy.secondPlayer')];
      actions = (
        <>
          <PairButton variant="role" enabled={teamToMove} onClick={() => moves.chooseRole(GUESSER_PLAYER)}>{first}</PairButton>
          <PairButton variant="role" enabled={teamToMove} onClick={() => moves.chooseRole(JUDGE_PLAYER)}>{second}</PairButton>
        </>
      );
    } else {
      status = teamToMove ? t('strategy.status.yourTurn') : t('strategy.status.botTurn');
      tone = teamToMove ? 'go' : 'wait';
    }
    // On a phone the two buttons fill the row, so the ⓘ stays in the corner.
    infoBeside = infoBeside && wide;

    const boardState: BoardState =
      finished ? 'locked'
      : betweenGames ? (lastResult !== null && !judgeToMove ? 'locked' : 'empty')
      : ctx.phase === 'chooseRole' ? 'locked'
      : teamToMove ? 'live' : 'waiting';

    const rulesButton = (
      <Button ref={rulesButtonRef} variant="outlined" color="inherit" size="small" onClick={() => setRulesOpen(!rulesOpen)}
        startIcon={<MenuBookOutlinedIcon />} aria-expanded={rulesOpen}
        onAnimationEnd={() => setPointToRules(false)}
        sx={{
          textTransform: 'none', fontWeight: 600, borderRadius: '8px', borderColor: LINE, backgroundColor: '#fff',
          '@keyframes pointToRules': {
            '0%': { boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0.5)}` },
            '100%': { boxShadow: `0 0 0 14px ${alpha(theme.palette.primary.main, 0)}` },
          },
          ...(pointToRules && { animation: 'pointToRules 0.9s ease-out 2' }),
        }}>
        {t('strategy.rules')}
      </Button>
    );

    return (
      <>
        <EndDialog open={finished} onClose={backToHome}>
          <StrategyEndTable allPoints={G.points} liveResults={G.liveResults} />
        </EndDialog>
        <Stack sx={{
          padding: { xs: '10px', md: '16px 20px' },
          backgroundColor: alpha(theme.palette.background.paper, theme.palette.background.paperOpacity),
          borderRadius: "25px",
          gap: '14px',
        }}>
          {/* The screen's one bar of its own, the same in every state: the
              live games so far are the only place for the streak and the stake. */}
          <Stack sx={{
            flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
            gap: '8px 16px', padding: '8px 16px', backgroundColor: '#fff', border: `1px solid ${LINE}`, borderRadius: '14px',
          }}>
            <Box sx={{ fontSize: '18px', fontWeight: 700 }}>{t('strategy.name')}</Box>
            <Box sx={{ order: { xs: 2, md: 0 }, width: { xs: '100%', md: 'auto' } }}>
              <Series G={G} ended={finished} />
            </Box>
            <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '14px' }}>
              <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 600 }}>
                <TimerOutlinedIcon fontSize="small" titleAccess={t('general.remainingTime')} sx={{ color: MUTED }} />
                {finished
                  ? ENDED_CLOCK
                  : <Countdown
                    msRemaining={msRemaining ?? null}
                    setMsRemaining={setMsRemaining}
                    getServerTimer={moves.getTime}
                    endTime={new Date(G.end)}
                    serverRemainingMs={G.millisecondsRemaining} />}
                {isOffline && <OfflineClockNote />}
              </Stack>
              {/* There from the start, under the first dialog, so the dialog
                  has a place to fly into. */}
              {rulesButton}
            </Stack>
          </Stack>
          <Box sx={{ position: 'relative' }}>
            <GameArea mode={difficulty} liveNumber={G.numberOfTries}
              status={status} tone={tone} sub={sub} actions={actions} callout={callout} intro={intro}
              info={<InfoButton startVaries={startVaries} />} infoBeside={infoBeside}>
              <BoardArea state={boardState}>{board(props)}</BoardArea>
            </GameArea>
            {/* Over the margin to the right of the game, which stays where it
                is: the board stays to read and play while the rules are open. */}
            {wide && rulesOpen && <Stack component="aside" aria-label={t('strategy.rules')} sx={{
              position: 'absolute', top: 0, right: 0, zIndex: 3, width: '330px',
              backgroundColor: '#fff', border: `1px solid ${LINE}`, borderRadius: '16px',
              boxShadow: '0 12px 32px rgba(0,0,0,.16)', padding: '14px 18px', gap: '8px',
            }}>
              <Stack sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ fontSize: '18px', fontWeight: 700 }}>{t('strategy.rules')}</Box>
                <IconButton aria-label={t('general.close')} onClick={() => setRulesOpen(false)}><CloseIcon /></IconButton>
              </Stack>
              <Box sx={{ fontSize: '15px', lineHeight: 1.55 }}>{rules}</Box>
            </Stack>}
          </Box>
        </Stack>
        {/* No onClose: neither a click beside it nor Esc stands for having
            read the rules. Once the time is up there is nothing left to read
            them for, and the end dialog must not sit under it. Its own exit is
            instant: closing, it has already flown into the rules button. */}
        <Dialog open={rulesFirst} fullScreen={!wide} maxWidth="md" fullWidth
          transitionDuration={{ enter: 225, exit: 0 }} slotProps={{ paper: { ref: firstRulesRef } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>{t('strategy.rulesFirst.title')}</DialogTitle>
          <DialogContent sx={{ fontSize: { xs: '16px', md: '18px' }, lineHeight: 1.6 }}>{rules}</DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button variant="contained" fullWidth onClick={closeFirstRules}
              sx={{ minHeight: '48px', fontSize: '16px', fontWeight: 600, textTransform: 'none', borderRadius: '10px' }}>
              {t('strategy.rulesFirst.button')}
            </Button>
          </DialogActions>
        </Dialog>
        {!wide && <Dialog open={rulesOpen} fullScreen onClose={() => setRulesOpen(false)}>
          <DialogTitle>{t('strategy.rules')}</DialogTitle>
          <DialogContent sx={{ fontSize: '16px', lineHeight: 1.6 }}>{rules}</DialogContent>
          <DialogActions>
            <Button onClick={() => setRulesOpen(false)}>{t('general.close')}</Button>
          </DialogActions>
        </Dialog>}
      </>
    );
  };
};

/// How many games before the current run the strip shows.
const SHOWN_BEFORE_RUN = 2;

/** The live games so far, and what the current run of wins still needs and is worth. */
/// Each played game is a ✓, ✗ or –; the run that counts, the wins since the
/// last loss and the games it still needs, is grouped with its points. That
/// is the one place the streak and the stake are shown.
function Series(props: { G: GameStateMixin, ended: boolean }) {
  const { t } = useTranslation();
  const { G } = props;
  const results = G.liveResults;
  const streak = Math.min(G.winningStreak, 2);
  // A match over without two wins in a row has no run left to finish: only
  // the games played show, with no empty slots and nothing at stake.
  const open = !props.ended || streak >= 2;
  const runStart = open ? Math.max(0, results.length - streak) : results.length;
  const hidden = Math.max(0, runStart - SHOWN_BEFORE_RUN);
  const points = streak >= 2 ? G.points : strategyPoints(G.numberOfLoss);
  const played = (result: LiveGameResult, i: number) => <SeriesCell key={i} kind={result} n={i + 1} />;
  return (
    <Stack role="group" aria-label={t('strategy.series.label')}
      sx={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
      <Box sx={{ fontSize: '13px', color: MUTED, marginRight: '6px' }}>{t('strategy.series.label')}</Box>
      {/* Only the latest games before the run: the earlier ones are behind a
          count, as the strip has a line to fit in. */}
      {hidden > 0 && <Box title={t('strategy.series.earlier', { count: hidden })} aria-label={t('strategy.series.earlier', { count: hidden })}
        role="img" sx={{ fontSize: '14px', fontWeight: 700, color: MUTED, padding: '0 4px' }}>…</Box>}
      {results.slice(hidden, runStart).map((result, i) => played(result, hidden + i))}
      {open && <LiveGameRun points={t('strategy.series.total', { points: pointsText(t, points) })}>
        {results.slice(runStart).map((result, i) => played(result, runStart + i))}
        {Array.from({ length: 2 - streak }, (_, k) => <SeriesCell key={`next${k}`} kind="next" n={results.length + k + 1} />)}
      </LiveGameRun>}
      {/* The cells and the grouped run read only once explained. */}
      <Tooltip title={<Box sx={{ fontSize: '14px', lineHeight: 1.45, padding: '4px' }}>{t('strategy.series.help')}</Box>}
        enterTouchDelay={0} leaveTouchDelay={10000} arrow>
        <IconButton size="small" aria-label={t('strategy.series.helpLabel')} sx={{ color: MUTED }}>
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

function SeriesCell(props: { kind: LiveGameResult | 'next', n: number }) {
  const { t } = useTranslation();
  const { kind, n } = props;
  const label = kind === 'won' ? t('strategy.series.won', { n })
    : kind === 'lost' ? t('strategy.series.lost', { n })
    : kind === 'unfinished' ? t('strategy.series.unfinished', { n })
    : t('strategy.series.next', { n });
  return <LiveGameCell kind={kind} n={n} label={label} />;
}

/// The one place that changes: a mode line, the status, a line under it, a row
/// of buttons, and the board. The rows keep their height when empty, so the
/// board does not move from one state to the next.
function GameArea(props: {
  mode: Difficulty | null, liveNumber: number, status: string, tone: Tone, sub: string,
  actions: ReactNode, callout: ReactNode, intro: ReactNode, info: ReactNode, infoBeside: boolean,
  children: ReactNode,
}) {
  const { mode, tone } = props;
  const toneColour = tone === 'go' ? 'primary.main' : tone === 'wait' ? MUTED : tone === 'won' ? WIN : tone === 'lost' ? LOSS : 'text.primary';
  return (
    <Stack data-testid="gameArea" data-mode={mode ?? 'none'} sx={{
      minWidth: 0, maxWidth: '900px', marginX: 'auto',
      backgroundColor: '#fff', border: `1px solid ${LINE}`, borderRadius: '16px',
      borderTop: mode === 'live' ? `4px solid ${LIVE}` : mode === 'test' ? `4px dashed ${PRACTICE_BORDER}` : `4px solid ${LINE}`,
      padding: { xs: '10px 14px 16px', md: '12px 20px 18px' }, gap: '6px',
    }}>
      <Stack sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: '28px' }}>
        <ModeLine mode={mode} liveNumber={props.liveNumber} />
        {!props.infoBeside && props.info}
      </Stack>
      {/* The same element for the whole match: a screen reader announces a
          change inside a live region, but often not one inserted filled. */}
      <Box role="status" sx={{
        minHeight: { xs: '44px', md: '48px' }, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
        fontSize: { xs: '24px', md: '28px' }, fontWeight: 700, textAlign: 'center', color: toneColour,
      }}>
        {tone === 'wait' && <BotThinking />}
        {props.status}
      </Box>
      {props.intro ?? <>
        <Box sx={{ minHeight: '22px', textAlign: 'center', fontSize: '15px', color: MUTED }}>{props.sub}</Box>
        <Stack sx={{ position: 'relative', minHeight: '52px', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          {props.actions}
          {props.infoBeside && <Box sx={{ position: 'absolute', left: 'calc(50% + 244px)' }}>{props.info}</Box>}
          {props.callout}
        </Stack>
        {props.children}
      </>}
    </Stack>
  );
}

function ModeLine(props: { mode: Difficulty | null, liveNumber: number }) {
  const { t } = useTranslation();
  const { mode } = props;
  if (mode === null) return <Box sx={{ fontSize: '14px', fontWeight: 600, color: MUTED }}>{t('strategy.mode.none')}</Box>;
  const live = mode === 'live';
  return (
    <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: live ? LIVE : PRACTICE }}>
      <Box aria-hidden sx={{
        width: '10px', height: '10px', borderRadius: '50%', boxSizing: 'border-box',
        ...(live ? { backgroundColor: LIVE } : { border: `2px solid ${PRACTICE}` }),
      }} />
      {live ? t('strategy.mode.live', { n: props.liveNumber }) : t('strategy.mode.practice')}
    </Stack>
  );
}

/// The bot mostly answers within a state update or two, so the spinner waits
/// a moment before it shows: shown at once, it would flash on every move; it
/// is there for a server that is slow to answer.
function BotThinking() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 300);
    return () => clearTimeout(timer);
  }, []);
  return <Box sx={{ width: '22px', height: '22px', display: 'flex' }}>
    {slow && <CircularProgress data-testid="botThinking" size={22} thickness={5} color="inherit" />}
  </Box>;
}

/// Two buttons side by side share one width, whatever their labels, so a
/// longer label does not make one look like the main choice.
function PairButton(props: { variant: 'role' | 'practice' | 'live', enabled: boolean, onClick: () => void, children: ReactNode }) {
  const { variant } = props;
  return (
    <Button
      variant={variant === 'practice' ? 'outlined' : 'contained'}
      disabled={!props.enabled}
      onClick={props.onClick}
      sx={{
        width: { xs: 'calc(50% - 6px)', sm: '230px' }, minHeight: '44px', fontSize: '16px', fontWeight: 600,
        textTransform: 'none', borderRadius: '10px',
        ...(variant === 'live' && { backgroundColor: LIVE, '&:hover': { backgroundColor: LIVE_DARK } }),
        ...(variant === 'practice' && { borderWidth: '2px', borderColor: '#8c959f', color: 'text.primary', '&:hover': { borderWidth: '2px' } }),
      }}>
      {props.children}
    </Button>
  );
}

/// Before the first game: the two kinds, each explained once under its button.
function Intro(props: { enabled: boolean, startVaries: boolean, moves: StrategyWrapperMoves }) {
  const { t } = useTranslation();
  const { enabled, startVaries, moves } = props;
  const buttonSx = { minHeight: '48px', fontSize: '16px', fontWeight: 600, textTransform: 'none', borderRadius: '10px' } as const;
  const textSx = { fontSize: '14px', lineHeight: 1.45, color: MUTED } as const;
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: '18px', sm: '24px' }, marginTop: '10px' }}>
        <Stack sx={{ gap: '10px' }}>
          <Button variant="outlined" fullWidth disabled={!enabled} onClick={() => moves.chooseNewGameType('test')}
            sx={{ ...buttonSx, borderWidth: '2px', borderColor: '#8c959f', color: 'text.primary', '&:hover': { borderWidth: '2px' } }}>
            {t('strategy.intro.practice')}
          </Button>
          <Box sx={textSx}>{startVaries ? t('strategy.intro.practiceTextVaries') : t('strategy.intro.practiceText')}</Box>
        </Stack>
        <Stack sx={{ gap: '10px' }}>
          <Button variant="contained" fullWidth disabled={!enabled} onClick={() => moves.chooseNewGameType('live')}
            sx={{ ...buttonSx, backgroundColor: LIVE, '&:hover': { backgroundColor: LIVE_DARK } }}>
            {t('strategy.intro.live')}
          </Button>
          <Box sx={textSx}>
            {t('strategy.intro.liveText', { first: STRATEGY_POINTS_BY_LOSSES[0], rest: STRATEGY_POINTS_BY_LOSSES.slice(1).join(', ') })}
          </Box>
        </Stack>
      </Box>
      <Box sx={{ textAlign: 'center', fontSize: '14px', color: MUTED, marginTop: '14px' }}>{t('strategy.intro.footer')}</Box>
    </>
  );
}

/// Under the live button after a practice game, until the first live one:
/// how a live game may differ from practice, in facts only.
function LiveHint(props: { after: 'won' | 'lost', startVaries: boolean }) {
  const { t } = useTranslation();
  const { after, startVaries } = props;
  const text = after === 'won'
    ? (startVaries ? t('strategy.liveHint.practiceBotVaries') : t('strategy.liveHint.practiceBot'))
    : t('strategy.liveHint.startDiffers');
  return (
    <Box role="note" sx={{
      position: 'absolute', top: '56px', zIndex: 2,
      left: { xs: 0, sm: 'calc(50% - 40px)' }, right: { xs: 0, sm: 'auto' }, width: { sm: '340px' },
      backgroundColor: '#fff', border: `1px solid ${LIVE}`, borderRadius: '12px', boxShadow: '0 10px 24px rgba(0,0,0,.14)',
      padding: '12px 14px', fontSize: '14px', lineHeight: 1.45, textAlign: 'left',
    }}>
      {text}
    </Box>
  );
}

/// Practice against live, behind an ⓘ: the explanation the first choice gave.
function InfoButton(props: { startVaries: boolean }) {
  const { t } = useTranslation();
  const title = (
    <Stack sx={{ gap: '6px', fontSize: '14px', lineHeight: 1.45, padding: '4px' }}>
      <span><b>{t('strategy.info.liveLabel')}</b> {t('strategy.info.liveText')}</span>
      <span><b>{t('strategy.info.practiceLabel')}</b> {props.startVaries ? t('strategy.info.practiceTextVaries') : t('strategy.info.practiceText')}</span>
      <span>{t('strategy.info.noAbandon')}</span>
    </Stack>
  );
  return (
    <Tooltip title={title} enterTouchDelay={0} leaveTouchDelay={10000} arrow>
      <IconButton size="small" aria-label={t('strategy.info.label')} sx={{ color: MUTED }}>
        <InfoOutlinedIcon />
      </IconButton>
    </Tooltip>
  );
}

function swallowClick(event: MouseEvent) {
  event.stopPropagation();
  event.preventDefault();
}

/// The game's own board, faded, locked or live as `BoardState` says. Out of
/// `live` no move reaches the server to be refused: the disabled fieldset
/// disables every control inside, focus and keys included, and announces it,
/// and the click capture covers what a board makes clickable without being a
/// control. Not `inert`: that would also hide the position from a screen
/// reader, and the team is to read it before choosing a role.
function BoardArea(props: { state: BoardState, children: ReactNode }) {
  const { state } = props;
  return (
    <Box
      component="fieldset"
      data-testid="strategyBoard"
      data-state={state}
      disabled={state !== 'live'}
      onClickCapture={state === 'live' ? undefined : swallowClick}
      sx={{
        // A fieldset's own border, margin, padding and min-content width reset.
        border: 0, margin: 0, padding: 0, minWidth: 0,
        display: 'flex', justifyContent: 'center',
        // On a laptop the window, not the column, is what runs short: what is
        // above the board takes about 460px, so a board that scales with its
        // width, as a square grid does, is narrowed to fit under it.
        '& > *': { width: '100%', maxWidth: 'max(240px, min(440px, calc(100dvh - 460px)))' },
        ...(state !== 'live' && { '& *': { cursor: 'default' } }),
        ...(state === 'empty' && { opacity: 0.4, filter: 'grayscale(1)' }),
        transition: 'opacity 0.3s',
      }}>
      {props.children}
    </Box>
  );
}
