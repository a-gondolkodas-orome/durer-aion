import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Tooltip, alpha, useMediaQuery } from "@mui/material";
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
import type { MouseEvent, ReactNode } from "react";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

/// What boardgame.io hands a strategy game's board: the game's own state as
/// gameWrapper extends it, plus the client API. The wrapper passes its props
/// through untouched, so a board may read anything bgio put there.
export type StrategyBoardProps<G> = BoardProps<G & GameStateMixin>;
export type StrategyBoard<G> = (props: StrategyBoardProps<G>) => ReactNode;

// The mode's colour is kept to the bar and the frame round the game, the one
// place that says which game this is; the rest of the screen is neutral.
// Live and practice differ in more than hue there — solid against dashed, a
// flag against a flask — so the mode reads without telling colours apart. A
// won game is green in both modes: the live orange sits too close to the red
// of a loss to mark a win.
const LIVE = '#c2410c';
const LIVE_TEXT = '#9a3412';
const PRACTICE = '#475569';
const PRACTICE_BORDER = '#64748b';
const PRACTICE_TINT = '#f1f5f9';
const PRACTICE_BAR = '#e8edf2';
const WIN = '#1b5e20';
const LOSS = '#8e1b10';
const MUTED = '#57606a';
const LOCKED = '#424a53';
const NEUTRAL_BORDER = '#d0d7de';

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
    // The game cards fold whenever a game starts: after the first one the
    // team knows the two kinds apart, and a folded card keeps what tells them
    // apart and its button. They open together, as they are read side by
    // side: one open beside one folded leaves the folded one an empty box of
    // the open one's height.
    const [cardsOpen, setCardsOpen] = useState(G.difficulty == null);
    const [cardsShownFor, setCardsShownFor] = useState(ctx.phase);
    if (cardsShownFor !== ctx.phase) {
      setCardsShownFor(ctx.phase);
      if (ctx.phase !== 'startNewGame') setCardsOpen(false);
    }

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
    const stakeInBar = difficulty === 'live' && !showResult && !finished;
    const chooserShown = betweenGames && !finished;
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
            detailLine={showResult && difficulty === 'live' ? liveResultDetail(G, lastResult, t) : null}
            status={stakeInBar &&
              <Box sx={{ fontSize: '16px', fontWeight: 600 }}>
                {t('strategy.mode.stake', { points: pointsText(t, strategyPoints(G.numberOfLoss)) })}
              </Box>}
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
              {/* On a phone the goal follows the board: the bar already has
                  the stake, and the board is what the team came for. */}
              <Stack sx={{ width: { xs: '100%', md: '34%' }, flexShrink: 0, gap: '16px', order: { xs: 2, md: 0 } }}>
                {/* Each sentence once on the screen: the bar's badge has the stake,
                    and the open live card what a loss costs. */}
                <GoalPanel G={G} practice={difficulty === 'test'}
                  showStake={!stakeInBar} showIfLose={!(chooserShown && cardsOpen)} />
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
                {/* Above the board every time, before the first game and after
                    each one: under the final position it would take a scroll
                    to find. */}
                {chooserShown &&
                  <ModeChooser G={G} moves={moves} enabled={teamToMove} starting={judgeToMove ? difficulty : null}
                    open={cardsOpen} onToggle={() => setCardsOpen(!cardsOpen)} />}
                {ctx.phase === 'chooseRole' && !finished && <RoleChooser moves={moves} enabled={teamToMove} />}
                <BoardArea state={boardState} final={lastResult !== null || finished}
                  result={showResult ? <ResultChip difficulty={difficulty} result={lastResult} /> : null}>
                  {board(props)}
                </BoardArea>
              </Stack>
            </Stack>
          </ModeFrame>
        </Stack>
        {/* No onClose: neither a click beside it nor Esc stands for having
            read the rules. Once the time is up there is nothing left to
            read them for, and the end dialog must not sit under it. */}
        <Dialog open={rulesFirst && !finished} fullScreen={!wide} maxWidth="md" fullWidth>
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
/// `status` fills the bar's free spot beside the clock, and `detailLine`, when
/// set, takes the place of the line under the mode's name. Before the first
/// game the bar is neutral and names the screen instead.
function ModeFrame(props: {
  difficulty: Difficulty | null, liveNumber: number, detailLine: string | null,
  status: ReactNode, clock: ReactNode, rulesButton: ReactNode, children: ReactNode,
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
          : difficulty === 'test' ? { backgroundColor: PRACTICE_BAR, color: '#1e293b' }
          : { backgroundColor: '#f6f4ee', color: '#1f2328' }),
      }}>
        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          {difficulty === 'live' && <FlagOutlinedIcon aria-hidden sx={{ fontSize: '28px' }} />}
          {difficulty === 'test' && <ScienceOutlinedIcon aria-hidden sx={{ fontSize: '28px', color: PRACTICE }} />}
          {difficulty === null
            ? <Box sx={{ fontSize: '20px', fontWeight: 700 }}>{t('strategy.name')}</Box>
            : <Stack>
              <Box sx={{ fontSize: '20px', fontWeight: 700 }}>
                {difficulty === 'live' ? t('strategy.mode.live') : t('strategy.mode.practice')}
              </Box>
              <Box sx={{ fontSize: '14px' }}>
                {props.detailLine ?? (difficulty === 'live' ? t('strategy.mode.liveNumber', { n: props.liveNumber }) : t('strategy.mode.practiceSub'))}
              </Box>
            </Stack>}
        </Stack>
        <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: { xs: '8px 10px', md: '8px 16px' } }}>
          {props.status}
          {props.clock}
          {props.rulesButton}
        </Stack>
      </Stack>
      {props.children}
    </Box>
  );
}

const pointsText = (t: TFunction, count: number) => t('general.points', { count });

/// The stake before and after one more live loss, from `losses` so far: it
/// drops only while the losses leave it room to.
function stakeChange(losses: number) {
  const before = strategyPoints(losses);
  const after = strategyPoints(losses + 1);
  return { before, after, drops: after < before };
}

/// What the next live loss would cost; `points` is the stake after it.
function lossCost(G: GameStateMixin, t: TFunction): { drops: boolean, points: string } {
  const { after, drops } = stakeChange(G.numberOfLoss);
  return { drops, points: pointsText(t, after) };
}

/** The goal of the match and how far the team is: the streak, the stake, the live games so far. */
function GoalPanel(props: { G: GameStateMixin, practice: boolean, showStake: boolean, showIfLose: boolean }) {
  const { t } = useTranslation();
  const { G, practice, showStake, showIfLose } = props;
  const stake = pointsText(t, strategyPoints(G.numberOfLoss));
  const loss = lossCost(G, t);
  // The second win in a row ends the match, so a streak of two shows only
  // behind the end dialog, and nothing is at stake any more.
  const streak = Math.min(G.winningStreak, 2);
  const done = streak === 2;
  return (
    <Stack sx={{ gap: '8px', backgroundColor: '#fff', border: `1px solid ${NEUTRAL_BORDER}`, borderRadius: '14px', padding: '14px 16px' }}>
      <Box sx={{ fontSize: '13px', fontWeight: 600, color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {t('strategy.goal.title')}
      </Box>
      <Box sx={{ fontSize: '17px', fontWeight: 600, lineHeight: 1.35 }}>{t('strategy.goal.text')}</Box>
      {/* The sentence above says what is counted, so on screen the count
          stands alone; its name is for a screen reader, and a hover, tap or
          focus. */}
      <Tooltip title={t('strategy.goal.progress')} enterTouchDelay={0} placement="bottom-start">
        <Stack role="img" tabIndex={0} aria-label={t('strategy.goal.progressCount', { n: streak })}
          sx={{ flexDirection: 'row', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', borderRadius: '6px' }}>
          {[0, 1].map(i => <Box key={i} sx={{
            width: '18px', height: '18px', borderRadius: '50%', boxSizing: 'border-box',
            ...(i < streak ? { backgroundColor: WIN } : { border: '2px solid #8c959f' }),
          }} />)}
          <Box component="b" sx={{ fontSize: '17px', marginLeft: '4px' }}>{streak} / 2</Box>
        </Stack>
      </Tooltip>
      {!done && (showStake || showIfLose) && <Box sx={{ fontSize: '14px', color: MUTED, lineHeight: 1.4 }}>
        {/* In a practice game the stake is the next live game's, not this one's. */}
        {showStake && (practice
          ? t('strategy.goal.stakeNextLive', { points: stake })
          : t('strategy.goal.stake', { points: stake }))}
        {showStake && showIfLose && ' '}
        {showIfLose && (loss.drops ? t('strategy.goal.ifLoseDrop', { points: loss.points }) : t('strategy.goal.ifLose'))}
      </Box>}
      {G.liveResults.length > 0 && <StrategyGamesTable results={G.liveResults} />}
    </Stack>
  );
}

function PracticeWarning() {
  const { t } = useTranslation();
  return (
    <Box sx={{ backgroundColor: PRACTICE_TINT, borderRadius: '14px', padding: '12px 16px', fontSize: '15px', lineHeight: 1.45 }}>
      <b>{t('strategy.practiceWarning.title')}</b> {t('strategy.practiceWarning.text')}
    </Box>
  );
}

/** How the game that just ended went, as the label on its final position. */
function ResultChip(props: { difficulty: Difficulty, result: 'won' | 'lost' }) {
  const { t } = useTranslation();
  const { difficulty, result } = props;
  const headline = difficulty === 'live'
    ? (result === 'won' ? t('strategy.result.liveWon') : t('strategy.result.liveLost'))
    : (result === 'won' ? t('strategy.result.practiceWon') : t('strategy.result.practiceLost'));
  return (
    <Stack role="status" data-testid="result" sx={{
      flexDirection: 'row', alignItems: 'center', borderRadius: '999px', padding: '5px 14px',
      backgroundColor: result === 'won' ? WIN : LOSS, color: '#fff', fontSize: '15px', fontWeight: 700,
      // Lifts it off the dashed edge it sits on.
      boxShadow: '0 0 0 3px #fff',
    }}>
      {headline}
    </Stack>
  );
}

/// What a finished live game changed, for the bar's second line. A live loss
/// has already been counted, so the stake it cost is the one before it.
function liveResultDetail(G: GameStateMixin, result: 'won' | 'lost', t: TFunction): string {
  if (result === 'won') return t('strategy.result.liveWonDetail', { points: pointsText(t, strategyPoints(G.numberOfLoss)) });
  const { before, after, drops } = stakeChange(Math.max(0, G.numberOfLoss - 1));
  return drops ? t('strategy.result.liveLostDrop', { before, after }) : t('strategy.result.liveLostDetail');
}

/// Two cards rather than two alike buttons: what each kind of game counts for,
/// and what a live one would change, sit next to the button that starts it.
function ModeChooser(props: {
  G: GameStateMixin, moves: StrategyWrapperMoves, enabled: boolean, starting: Difficulty | null,
  open: boolean, onToggle: () => void,
}) {
  const { t } = useTranslation();
  const { G, moves, enabled, starting, open, onToggle } = props;
  const ifWin = G.winningStreak >= 1
    ? t('strategy.chooser.liveIfWinDone', { points: pointsText(t, strategyPoints(G.numberOfLoss)) })
    : t('strategy.chooser.liveIfWinFirst');
  const loss = lossCost(G, t);
  const ifLose = loss.drops ? t('strategy.chooser.liveIfLoseDrop', { points: loss.points }) : t('strategy.chooser.liveIfLose');
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
          open={open}
          onToggle={onToggle}
          button={starting === 'test' ? t('strategy.chooser.starting') : t('strategy.chooser.practiceButton')}
          enabled={enabled}
          onClick={() => moves.chooseNewGameType('test')}
        />
        <ModeCard
          live
          title={t('strategy.mode.live')}
          subtitle={t('strategy.chooser.liveSub')}
          points={[ifWin, ifLose]}
          open={open}
          onToggle={onToggle}
          button={starting === 'live' ? t('strategy.chooser.starting') : t('strategy.chooser.liveButton')}
          enabled={enabled}
          onClick={() => moves.chooseNewGameType('live')}
        />
      </Box>
    </Stack>
  );
}

function ModeCard(props: {
  live: boolean, title: string, subtitle: string, points?: string[], note?: ReactNode, open: boolean, onToggle: () => void,
  button: string, enabled: boolean, onClick: () => void,
}) {
  const { t } = useTranslation();
  const { live, open } = props;
  return (
    <Stack sx={{
      border: `1px solid ${NEUTRAL_BORDER}`, borderRadius: '16px',
      padding: '16px', gap: '10px', backgroundColor: '#fff',
    }}>
      <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
        <Stack sx={{ flex: 1 }}>
          <Box sx={{ fontSize: '20px', fontWeight: 700 }}>{props.title}</Box>
          {open && <Box sx={{ fontSize: '14px', fontWeight: 600, color: MUTED }}>{props.subtitle}</Box>}
        </Stack>
        <IconButton aria-label={t('strategy.chooser.details')} aria-expanded={open} onClick={props.onToggle}>
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
    <Stack sx={{ gap: '10px' }}>
      <Box sx={{ fontSize: '20px', fontWeight: 700 }}>{t('strategy.role.prompt')}</Box>
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

/// Whose turn it is, on the board's top edge, where the team looks to move:
/// the strongest signal on the screen while a game is on. One status element
/// for the whole match, empty between games, whose text changes: a screen
/// reader announces a change inside a live region, but often not one that is
/// inserted already filled.
/// The bot mostly answers within a state update or two, so on its turn the
/// spinner waits a moment before it shows: shown at once, it would flash on
/// every move; it is there for a server that is slow to answer.
function TurnStatus(props: { turn: 'team' | 'bot' | null }) {
  const { t } = useTranslation();
  const { turn } = props;
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (turn !== 'bot') return;
    const timer = setTimeout(() => setSlow(true), 300);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [turn]);
  return (
    <Box role="status" data-testid="turnStatus" sx={{ position: 'absolute', top: '-20px', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      {turn === 'team' && <Box sx={{
        borderRadius: '999px', padding: '8px 22px', fontSize: '19px', fontWeight: 700,
        backgroundColor: 'primary.main', color: 'primary.contrastText', boxShadow: '0 0 0 4px #fff',
      }}>
        {t('strategy.board.yourTurn')}
      </Box>}
      {turn === 'bot' && <Stack sx={{
        flexDirection: 'row', alignItems: 'center', gap: '10px',
        borderRadius: '999px', padding: '7px 20px', fontSize: '17px', fontWeight: 600,
        backgroundColor: LOCKED, color: '#fff', boxShadow: '0 0 0 4px #fff',
      }}>
        <Box sx={{ width: '16px', height: '16px', display: 'flex' }}>
          {slow && <CircularProgress data-testid="botThinking" size={16} thickness={5} color="inherit" />}
        </Box>
        {t('strategy.board.botTurn')}
      </Stack>}
    </Box>
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
/// A finished game's `result` is its final position's label; otherwise a
/// locked board says it is only to look at.
function BoardArea(props: { state: BoardState, final: boolean, result: ReactNode, children: ReactNode }) {
  const { t } = useTranslation();
  const { state } = props;
  return (
    <Box sx={{
      position: 'relative', borderRadius: '14px', backgroundColor: '#fafaf7',
      // Room for the label that straddles the top edge, clear of whatever is
      // above the board. The same in every state, so the board does not move
      // as a game goes from role choice to play to its final position.
      marginTop: '24px',
    }}>
      <Box
        component="fieldset"
        data-testid="strategyBoard"
        data-state={state}
        disabled={state !== 'live'}
        onClickCapture={state === 'live' ? undefined : swallowClick}
        sx={{
          // A fieldset's own border, margin and min-content width reset.
          border: 0, margin: 0, minWidth: 0,
          // The top padding keeps the centred turn label off the board's own
          // first line; the same in every state, like the margin above.
          display: 'flex', padding: '30px 15px 15px', borderRadius: '14px',
          ...(state !== 'live' && { '& *': { cursor: 'default' } }),
          ...(state === 'empty' && { opacity: 0.4, filter: 'grayscale(1)' }),
          ...(state === 'locked' && { outline: '2px dashed #8c959f', outlineOffset: '-2px' }),
          ...(state === 'live' && { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: '-3px' }),
          transition: 'opacity 0.3s',
        }}>
        {props.children}
      </Box>
      {/* On the edge, like a label on a frame, so it takes no height of the
          board's: the result, whose turn, or that it is only to look at. */}
      <TurnStatus turn={state === 'live' ? 'team' : state === 'waiting' ? 'bot' : null} />
      {props.result !== null
        ? <Box sx={{ position: 'absolute', top: '-16px', right: '16px', left: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          {props.result}
        </Box>
        : state === 'locked' && <Stack sx={{
          position: 'absolute', top: '-12px', right: '16px', flexDirection: 'row', alignItems: 'center', gap: '6px',
          backgroundColor: LOCKED, color: '#fff', borderRadius: '999px', padding: '4px 12px', fontSize: '13px', fontWeight: 600,
        }}>
          <LockOutlinedIcon aria-hidden sx={{ fontSize: '16px' }} />
          {props.final ? t('strategy.board.finalViewOnly') : t('strategy.board.viewOnly')}
        </Stack>}
    </Box>
  );
}
