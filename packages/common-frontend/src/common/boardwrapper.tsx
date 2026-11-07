import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, alpha, useMediaQuery } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import { useEffect, useMemo, useState } from "react";
import { Countdown, ENDED_CLOCK, OfflineClockNote, useMsRemaining } from "../client/components/Countdown";
import { EndDialog } from "../client/components/EndCard";
import { StrategyEndTable } from "../client/components/StrategyEndTable";
import { StrategyGamesTable } from "../client/components/ResultTables";
import { useBackToHome } from "../client/hooks/user-hooks";
import { useClientRepo } from "../client/client-repo-context";
import { asStrategyWrapperMoves } from "../client/match-moves";
import type { StrategyWrapperMoves } from "../client/match-moves";
import { GUESSER_PLAYER, JUDGE_PLAYER, strategyPoints } from "game";
import type { Difficulty, GameStateMixin } from "game";
import type { BoardProps } from "boardgame.io/react";
import type { ReactNode } from "react";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

/// What boardgame.io hands a strategy game's board: the game's own state as
/// gameWrapper extends it, plus the client API. The wrapper passes its props
/// through untouched, so a board may read anything bgio put there.
export type StrategyBoardProps<G> = BoardProps<G & GameStateMixin>;
export type StrategyBoard<G> = (props: StrategyBoardProps<G>) => ReactNode;

// Live and practice differ in more than hue — solid against dashed, a flag
// against a flask — so the mode reads without telling colours apart. A won
// game is green in both modes: the live orange sits too close to the red of a
// loss to mark a win.
const LIVE = '#c2410c';
const LIVE_TEXT = '#9a3412';
const LIVE_TINT = '#fff1e6';
const PRACTICE = '#475569';
const PRACTICE_BORDER = '#64748b';
const PRACTICE_TINT = '#f1f5f9';
const PRACTICE_STRIPES = 'repeating-linear-gradient(135deg, #eef2f6 0 14px, #e2e8f0 14px 28px)';
const WIN = '#1b5e20';
const LOSS = '#8e1b10';
const MUTED = '#57606a';
const LOCKED = '#424a53';

/// What the board area shows. `empty` has no position worth reading: no game
/// yet, or the bot still placing the next one. `locked` has one the team
/// needs to see but may not move on: the role depends on the opening position,
/// and a finished game's is its result. `waiting` is the bot's turn, which
/// only ignores clicks: the bot answers within a state update or two, so
/// fading the board on each of its moves would flash it every turn.
type BoardState = 'empty' | 'locked' | 'live' | 'waiting';

export function boardWrapper<G>(board: StrategyBoard<G>, description: ReactNode) {
  return (props: StrategyBoardProps<G>) => {
    const { G, ctx } = props;
    const moves = useMemo(() => asStrategyWrapperMoves(props.moves), [props.moves]);
    const [msRemaining, setMsRemaining] = useMsRemaining(G.millisecondsRemaining); // asked from the server
    const backToHome = useBackToHome();
    const isOffline = useClientRepo().version === "OFFLINE";
    const theme = useTheme();
    const { t } = useTranslation();
    // `noSsr` reads the width on the first render, so the rules do not show
    // in one place and then jump to the other.
    const wide = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
    const [rulesFolded, setRulesFolded] = useState(false);
    const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
    // Before the first game the rules open in a dialog of their own, which
    // only the team's word that it has read them closes. Once a game has been
    // chosen that has happened, so nothing needs to remember it across a
    // reload.
    const [rulesRead, setRulesRead] = useState(false);

    useEffect(() => {
      if (!ctx.gameover) {
        moves.getTime();
      }
    }, [ctx.gameover, moves]);
    // ctx.gameover is whatever the game passed to events.endGame(); this wrapper
    // only ever asks whether it is `true`.
    const finished = msRemaining < - 5000 || ctx.gameover === true
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
    const rulesFirst = difficulty === null && !rulesRead;
    const showResult = betweenGames && !finished && !judgeToMove && lastResult !== null && difficulty !== null;
    const boardState: BoardState =
      finished ? 'locked'
      : betweenGames ? (lastResult !== null && !judgeToMove ? 'locked' : 'empty')
      : ctx.phase === 'chooseRole' ? 'locked'
      : teamToMove ? 'live' : 'waiting';

    return (
      <>
        <EndDialog open={finished} onClose={backToHome}>
          <StrategyEndTable allPoints={G.points} liveResults={G.liveResults} />
        </EndDialog>
        <Stack sx={{
          padding: { xs: '14px', md: '20px' },
          backgroundColor: alpha(theme.palette.background.paper, theme.palette.background.paperOpacity),
          borderRadius: "25px",
          gap: '16px',
        }}>
          {/* The screen has one bar of its own, the mode frame's: the clock
              and, on a phone, the rules sit in it rather than in rows above
              the board. */}
          <ModeFrame
            difficulty={difficulty}
            liveNumber={G.numberOfTries}
            stake={showResult || finished ? null : strategyPoints(G.numberOfLoss)}
            clock={<Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '6px', fontSize: '16px' }}>
              {/* On a phone an icon stands for the label, so the bar's right
                  half fits one line. */}
              {wide
                ? <Box component="span" sx={{ fontWeight: 600 }}>{t('general.remainingTime')}:</Box>
                : <TimerOutlinedIcon fontSize="small" titleAccess={t('general.remainingTime')} />}
              {finished
                ? ENDED_CLOCK
                : <Countdown
                  msRemaining={msRemaining ?? null}
                  setMsRemaining={setMsRemaining}
                  getServerTimer={moves.getTime}
                  endTime={new Date(G.end)}
                  serverRemainingMs={G.millisecondsRemaining} />}
              {isOffline && <OfflineClockNote />}
            </Stack>}
            rulesButton={!wide && !rulesFirst && <Button variant="outlined" color="inherit" size="small" onClick={() => setRulesDialogOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}>
              {t('strategy.rules')}
            </Button>}
          >
            <Stack sx={{ flexDirection: { xs: 'column', md: 'row' }, gap: '20px', padding: { xs: '14px', md: '20px' } }}>
              <Stack sx={{ width: { xs: '100%', md: '34%' }, flexShrink: 0, gap: '16px' }}>
                <GoalPanel G={G} practice={difficulty === 'test'} />
                {/* Once a screen: between games the practice card carries it. */}
                {difficulty === 'test' && !betweenGames && <PracticeWarning />}
                {/* Beside the board on a wide screen, where the column has
                    room to spare: open from the start, and no height spent. */}
                {wide && !rulesFirst && <Box component="details" open={!rulesFolded} onToggle={(event) => setRulesFolded(!event.currentTarget.open)} sx={{
                  border: '1px solid #d8d3c4', borderRadius: '14px', backgroundColor: '#fffdf5',
                  padding: '12px 16px', fontSize: '15px', lineHeight: 1.5,
                }}>
                  <Box component="summary" sx={{ fontWeight: 700, cursor: 'pointer' }}>{t('strategy.rules')}</Box>
                  {description}
                </Box>}
              </Stack>
              <Stack sx={{ flex: 1, minWidth: 0, gap: '14px' }}>
                {showResult && <ResultBar G={G} difficulty={difficulty} result={lastResult} />}
                {/* Above the board every time, before the first game and after
                    each one: under the board it took a scroll past the final
                    position to find. */}
                {betweenGames && !finished &&
                  <ModeChooser G={G} moves={moves} enabled={teamToMove} starting={judgeToMove ? difficulty : null} />}
                {ctx.phase === 'chooseRole' && !finished && <RoleChooser moves={moves} enabled={teamToMove} />}
                {ctx.phase === 'play' && !finished && <TurnLabel teamToMove={teamToMove} />}
                <BoardArea state={boardState} hasResult={lastResult !== null || finished}>
                  {board(props)}
                </BoardArea>
              </Stack>
            </Stack>
          </ModeFrame>
        </Stack>
        {/* No onClose: neither a click beside it nor Esc stands for having
            read the rules. */}
        <Dialog open={rulesFirst} fullScreen={!wide} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>{t('strategy.rulesFirst.title')}</DialogTitle>
          <DialogContent sx={{ fontSize: { xs: '16px', md: '18px' }, lineHeight: 1.6 }}>{description}</DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button variant="contained" fullWidth onClick={() => setRulesRead(true)}
              sx={{ minHeight: '48px', fontSize: '16px', fontWeight: 600, textTransform: 'none', borderRadius: '10px' }}>
              {t('strategy.rulesFirst.button')}
            </Button>
          </DialogActions>
        </Dialog>
        {!wide && <Dialog open={rulesDialogOpen} onClose={() => setRulesDialogOpen(false)}>
          <DialogTitle>{t('strategy.rules')}</DialogTitle>
          <DialogContent sx={{ fontSize: '15px', lineHeight: 1.5 }}>{description}</DialogContent>
          <DialogActions>
            <Button onClick={() => setRulesDialogOpen(false)}>{t('general.close')}</Button>
          </DialogActions>
        </Dialog>}
      </>
    );
  };
};

/** The frame round the game: its bar and border say whether this game counts. */
/// `stake` is null once the game is over: the frame then describes a game
/// played for the stake before its result, and the next game's is on its card.
/// Before the first game the bar is neutral and names the screen instead.
function ModeFrame(props: {
  difficulty: Difficulty | null, liveNumber: number, stake: number | null,
  clock: ReactNode, rulesButton: ReactNode, children: ReactNode,
}) {
  const { t } = useTranslation();
  const { difficulty } = props;
  const border = difficulty === 'live' ? `3px solid ${LIVE}`
    : difficulty === 'test' ? `3px dashed ${PRACTICE_BORDER}`
    : '1px solid #d8d3c4';
  return (
    <Box sx={{ border, borderRadius: '20px', overflow: 'hidden', backgroundColor: '#fff' }}>
      <Stack sx={{
        flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: '8px 20px', padding: '10px 18px',
        ...(difficulty === 'live' ? { backgroundColor: LIVE, color: '#fff' }
          : difficulty === 'test' ? { background: PRACTICE_STRIPES, color: '#1e293b' }
          : { backgroundColor: '#f6f4ee', color: '#1f2328' }),
      }}>
        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          {difficulty === 'live' && <FlagOutlinedIcon aria-hidden sx={{ fontSize: '28px' }} />}
          {difficulty === 'test' && <ScienceOutlinedIcon aria-hidden sx={{ fontSize: '28px', color: PRACTICE }} />}
          {difficulty === null
            ? <Box sx={{ fontSize: '20px', fontWeight: 700 }}>{t('strategy.name')}</Box>
            : <Stack>
              <Box sx={{ fontSize: '19px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {difficulty === 'live' ? t('strategy.mode.live') : t('strategy.mode.practice')}
              </Box>
              <Box sx={{ fontSize: '14px' }}>
                {difficulty === 'live' ? t('strategy.mode.liveNumber', { n: props.liveNumber }) : t('strategy.mode.practiceSub')}
              </Box>
            </Stack>}
        </Stack>
        <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: { xs: '8px 10px', md: '8px 16px' } }}>
          {difficulty === 'live' && props.stake !== null &&
            <Box sx={{ backgroundColor: '#fff', borderRadius: '12px', padding: '6px 14px', fontWeight: 600, color: LIVE_TEXT }}>
              {t('strategy.mode.stake', { points: t('general.points', { count: props.stake }) })}
            </Box>}
          {props.clock}
          {props.rulesButton}
        </Stack>
      </Stack>
      {props.children}
    </Box>
  );
}

/** The goal of the match and how far the team is: the streak, the stake, the live games so far. */
/// In a practice game the panel turns slate like the frame round it: the
/// streak it shows is the live one, which the practice game leaves alone.
function GoalPanel(props: { G: GameStateMixin, practice: boolean }) {
  const { t } = useTranslation();
  const { G, practice } = props;
  const stake = strategyPoints(G.numberOfLoss);
  const stakeAfterLoss = strategyPoints(G.numberOfLoss + 1);
  // The second win in a row ends the match, so a streak of two shows only
  // behind the end dialog, and nothing is at stake any more.
  const done = G.winningStreak >= 2;
  return (
    <Stack sx={{ gap: '12px', backgroundColor: practice ? PRACTICE_TINT : LIVE_TINT, borderRadius: '14px', padding: '16px' }}>
      <Box sx={{ fontSize: '13px', fontWeight: 600, color: practice ? PRACTICE : LIVE_TEXT, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {t('strategy.goal.title')}
      </Box>
      <Box sx={{ fontSize: '17px', fontWeight: 600, lineHeight: 1.35 }}>{t('strategy.goal.text')}</Box>
      <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
        <StreakSlot won={G.winningStreak >= 1} label="1" wonLabel={t('strategy.goal.firstWin')} practice={practice} />
        <Box sx={{ width: '18px', height: '3px', backgroundColor: practice ? '#cbd5e1' : '#e8b79a' }} />
        <StreakSlot won={done} label="2" wonLabel={t('strategy.goal.secondWin')} practice={practice} />
        <Box sx={{ fontSize: '15px', marginLeft: '6px' }}>
          {done ? t('strategy.goal.done') : G.winningStreak >= 1 ? t('strategy.goal.oneMore') : t('strategy.goal.twoMore')}
        </Box>
      </Stack>
      {!done && <Box sx={{ fontSize: '14px', color: MUTED, lineHeight: 1.4 }}>
        {/* In a practice game the stake is the next live game's, not this one's. */}
        {practice
          ? t('strategy.goal.stakeNextLive', { points: t('general.points', { count: stake }) })
          : t('strategy.goal.stake', { points: t('general.points', { count: stake }) })}{' '}
        {stakeAfterLoss < stake
          ? t('strategy.goal.ifLoseDrop', { points: t('general.points', { count: stakeAfterLoss }) })
          : t('strategy.goal.ifLose')}
      </Box>}
      {G.liveResults.length > 0 && <StrategyGamesTable results={G.liveResults} />}
    </Stack>
  );
}

function StreakSlot(props: { won: boolean, label: string, wonLabel: string, practice: boolean }) {
  const size = '44px';
  return props.won
    ? <Box role="img" aria-label={props.wonLabel} sx={{
      width: size, height: size, borderRadius: '50%', backgroundColor: WIN, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}><CheckIcon /></Box>
    : <Box sx={{
      width: size, height: size, borderRadius: '50%', border: `3px dashed ${props.practice ? PRACTICE_BORDER : LIVE}`, boxSizing: 'border-box',
      color: props.practice ? PRACTICE : LIVE_TEXT, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{props.label}</Box>;
}

function PracticeWarning() {
  const { t } = useTranslation();
  return (
    <Box sx={{ backgroundColor: PRACTICE_TINT, borderRadius: '14px', padding: '12px 16px', fontSize: '15px', lineHeight: 1.45 }}>
      <b>{t('strategy.practiceWarning.title')}</b> {t('strategy.practiceWarning.text')}
    </Box>
  );
}

/** How the game that just ended went, above its final position. */
function ResultBar(props: { G: GameStateMixin, difficulty: Difficulty, result: 'won' | 'lost' }) {
  const { t } = useTranslation();
  const { G, difficulty, result } = props;
  const live = difficulty === 'live';
  // A live loss has already been counted, so the stake it cost is the one
  // before it.
  const before = strategyPoints(Math.max(0, G.numberOfLoss - 1));
  const after = strategyPoints(G.numberOfLoss);
  const headline = live
    ? (result === 'won' ? t('strategy.result.liveWon') : t('strategy.result.liveLost'))
    : (result === 'won' ? t('strategy.result.practiceWon') : t('strategy.result.practiceLost'));
  const detail = !live ? t('strategy.result.practiceDetail')
    : result === 'won' ? t('strategy.result.liveWonDetail', { points: t('general.points', { count: after }) })
    : before > after ? t('strategy.result.liveLostDrop', { before, after })
    : t('strategy.result.liveLostDetail');
  return (
    <Stack role="status" sx={{ alignItems: 'center', gap: '8px', textAlign: 'center' }}>
      <Stack sx={{
        flexDirection: 'row', alignItems: 'center', gap: '8px', borderRadius: '999px', padding: '8px 20px',
        backgroundColor: result === 'won' ? WIN : LOSS, color: '#fff', fontSize: '18px', fontWeight: 700,
      }}>
        {result === 'won' ? <CheckIcon aria-hidden /> : <CloseIcon aria-hidden />}
        {headline}
      </Stack>
      <Box sx={{ fontSize: '15px', lineHeight: 1.45 }}>{detail}</Box>
    </Stack>
  );
}

/// Two cards rather than two alike buttons: what each kind of game counts for,
/// and what a live one would change, sit next to the button that starts it.
function ModeChooser(props: {
  G: GameStateMixin, moves: StrategyWrapperMoves, enabled: boolean, starting: Difficulty | null,
}) {
  const { t } = useTranslation();
  const { G, moves, enabled, starting } = props;
  const stake = strategyPoints(G.numberOfLoss);
  const stakeAfterLoss = strategyPoints(G.numberOfLoss + 1);
  const ifWin = G.winningStreak >= 1
    ? t('strategy.chooser.liveIfWinDone', { points: t('general.points', { count: stake }) })
    : t('strategy.chooser.liveIfWinFirst');
  // After the first game the team knows the two kinds: each card folds to
  // what tells them apart and its button, and opens for the rest.
  const folded = G.difficulty != null;
  const ifLose = stakeAfterLoss < stake
    ? t('strategy.chooser.liveIfLoseDrop', { points: t('general.points', { count: stakeAfterLoss }) })
    : t('strategy.chooser.liveIfLose');
  return (
    <Stack sx={{ gap: '10px' }}>
      <Box sx={{ fontSize: '20px', fontWeight: 700 }}>{t('strategy.chooser.title')}</Box>
      <Box sx={{ fontSize: '15px', color: MUTED, marginTop: '-6px' }}>{t('strategy.chooser.noAbandon')}</Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '14px' }}>
        <ModeCard
          live={false}
          title={t('strategy.mode.practice')}
          subtitle={t('strategy.mode.practiceSub')}
          note={<><b>{t('strategy.practiceWarning.title')}</b> {t('strategy.practiceWarning.text')}</>}
          folded={folded}
          button={starting === 'test' ? t('strategy.chooser.starting') : t('strategy.chooser.practiceButton')}
          enabled={enabled}
          onClick={() => moves.chooseNewGameType('test')}
        />
        <ModeCard
          live
          title={t('strategy.mode.live')}
          subtitle={t('strategy.chooser.liveSub')}
          points={[ifWin, ifLose]}
          folded={folded}
          button={starting === 'live' ? t('strategy.chooser.starting') : t('strategy.chooser.liveButton')}
          enabled={enabled}
          onClick={() => moves.chooseNewGameType('live')}
        />
      </Box>
    </Stack>
  );
}

function ModeCard(props: {
  live: boolean, title: string, subtitle: string, points?: string[], note?: ReactNode, folded: boolean,
  button: string, enabled: boolean, onClick: () => void,
}) {
  const { t } = useTranslation();
  const { live } = props;
  const [open, setOpen] = useState(!props.folded);
  return (
    <Stack sx={{
      border: live ? `3px solid ${LIVE}` : `3px dashed ${PRACTICE_BORDER}`, borderRadius: '16px',
      padding: '16px', gap: '10px', backgroundColor: '#fff',
    }}>
      <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
        {live
          ? <FlagOutlinedIcon aria-hidden sx={{ color: LIVE, fontSize: '30px' }} />
          : <ScienceOutlinedIcon aria-hidden sx={{ color: PRACTICE, fontSize: '30px' }} />}
        <Stack sx={{ flex: 1 }}>
          <Box sx={{ fontSize: '20px', fontWeight: 700 }}>{props.title}</Box>
          {open && <Box sx={{ fontSize: '14px', fontWeight: 600, color: live ? LIVE_TEXT : PRACTICE }}>{props.subtitle}</Box>}
        </Stack>
        <IconButton aria-label={t('strategy.chooser.details')} aria-expanded={open} onClick={() => setOpen(!open)}>
          <ExpandMoreIcon sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </IconButton>
      </Stack>
      {open && <>
        {props.points && <Box component="ul" sx={{ margin: 0, paddingLeft: '20px', fontSize: '15px', lineHeight: 1.45 }}>
          {props.points.map(point => <li key={point}>{point}</li>)}
        </Box>}
        {props.note && <Box sx={{ fontSize: '14px', lineHeight: 1.45, backgroundColor: PRACTICE_TINT, borderRadius: '10px', padding: '8px 12px' }}>
          {props.note}
        </Box>}
      </>}
      <Button
        variant={live ? 'contained' : 'outlined'}
        disabled={!props.enabled}
        onClick={props.onClick}
        sx={{
          marginTop: 'auto', minHeight: '50px', fontSize: '16px', fontWeight: 600, textTransform: 'none', borderRadius: '10px',
          ...(live
            ? { backgroundColor: LIVE, '&:hover': { backgroundColor: LIVE_TEXT } }
            : { borderWidth: '2px', borderColor: PRACTICE, color: '#334155', '&:hover': { borderWidth: '2px', borderColor: PRACTICE } }),
        }}
      >
        {props.button}
      </Button>
    </Stack>
  );
}

function RoleChooser(props: { moves: StrategyWrapperMoves, enabled: boolean }) {
  const { t } = useTranslation();
  const buttonSx = { flex: 1, minHeight: '50px', fontSize: '16px', textTransform: 'none', borderRadius: '10px' } as const;
  return (
    <Stack sx={{ gap: '10px', backgroundColor: LIVE_TINT, border: `2px solid ${LIVE}`, borderRadius: '14px', padding: '14px' }}>
      <Box sx={{ fontSize: '16px', fontWeight: 600 }}>{t('strategy.role.prompt')}</Box>
      <Stack sx={{ flexDirection: 'row', gap: '10px' }}>
        <Button sx={buttonSx} variant="contained" disabled={!props.enabled} onClick={() => props.moves.chooseRole(GUESSER_PLAYER)}>
          {t('strategy.firstPlayer')}
        </Button>
        <Button sx={buttonSx} variant="contained" disabled={!props.enabled} onClick={() => props.moves.chooseRole(JUDGE_PLAYER)}>
          {t('strategy.secondPlayer')}
        </Button>
      </Stack>
    </Stack>
  );
}

function TurnLabel(props: { teamToMove: boolean }) {
  const { t } = useTranslation();
  return (
    <Box role="status" sx={{
      alignSelf: 'center', borderRadius: '999px', padding: '8px 18px', fontWeight: 600,
      ...(props.teamToMove ? { backgroundColor: 'primary.main', color: 'primary.contrastText' } : { backgroundColor: '#dde1e6', color: LOCKED }),
    }}>
      {props.teamToMove ? t('strategy.board.yourTurn') : t('strategy.board.botTurn')}
    </Box>
  );
}

/// The game's own board, faded, locked or live as `BoardState` says. Out of
/// `live` it is inert, so no click reaches a move the server would refuse.
function BoardArea(props: { state: BoardState, hasResult: boolean, children: ReactNode }) {
  const { t } = useTranslation();
  const { state } = props;
  return (
    <Box sx={{ position: 'relative', borderRadius: '14px', backgroundColor: '#fafaf7' }}>
      <Box
        data-testid="strategyBoard"
        data-state={state}
        aria-disabled={state !== 'live'}
        inert={state !== 'live'}
        sx={{
          display: 'flex', padding: '15px', borderRadius: '14px',
          pointerEvents: state === 'live' ? 'auto' : 'none',
          ...(state === 'empty' && { opacity: 0.4, filter: 'grayscale(1)' }),
          ...(state === 'locked' && { outline: '2px dashed #8c959f', outlineOffset: '-2px', paddingTop: '44px' }),
          transition: 'opacity 0.3s',
        }}>
        {props.children}
      </Box>
      {state === 'locked' && <Stack sx={{
        position: 'absolute', top: '10px', right: '10px', flexDirection: 'row', alignItems: 'center', gap: '6px',
        backgroundColor: LOCKED, color: '#fff', borderRadius: '999px', padding: '4px 12px', fontSize: '13px', fontWeight: 600,
      }}>
        <LockOutlinedIcon aria-hidden sx={{ fontSize: '16px' }} />
        {props.hasResult ? t('strategy.board.finalViewOnly') : t('strategy.board.viewOnly')}
      </Stack>}
    </Box>
  );
}
