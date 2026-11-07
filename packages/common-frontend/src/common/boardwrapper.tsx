import { Box, Button, Stack, alpha, useMediaQuery } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
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
    // `noSsr` reads the width on the first render, so the rules do not open
    // and then snap shut on a phone.
    const wide = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
    const [rulesOpen, setRulesOpen] = useState(wide);

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
          <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px' }}>
            <Box sx={{ fontSize: '22px', fontWeight: 700 }}>{t('strategy.name')}</Box>
            <Box sx={{ flex: 1 }} />
            <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '6px', fontSize: '17px' }}>
              <b>{t('general.remainingTime')}:</b>
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
          </Stack>

          {/* Above everything it governs, so a team never has to look for
              it. Open from the start where it fits beside the game; on a
              phone it would push the board two screens down, so it starts
              collapsed there, its heading still first on the page. */}
          <Box component="details" open={rulesOpen} onToggle={(event) => setRulesOpen(event.currentTarget.open)} sx={{
            border: '1px solid #d8d3c4', borderRadius: '14px', backgroundColor: '#fffdf5',
            padding: '12px 18px', fontSize: { xs: '15px', md: '17px' }, lineHeight: 1.5,
          }}>
            <Box component="summary" sx={{ fontWeight: 700, cursor: 'pointer' }}>{t('strategy.rules')}</Box>
            {description}
          </Box>

          <ModeFrame difficulty={difficulty} liveNumber={G.numberOfTries} stake={showResult || finished ? null : strategyPoints(G.numberOfLoss)}>
            <Stack sx={{ flexDirection: { xs: 'column', md: 'row' }, gap: '20px', padding: { xs: '14px', md: '20px' } }}>
              <Stack sx={{ width: { xs: '100%', md: '34%' }, flexShrink: 0, gap: '16px' }}>
                <GoalPanel G={G} practice={difficulty === 'test'} />
                {difficulty === 'test' && <PracticeWarning />}
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
      </>
    );
  };
};

/** The frame round the game: its band and border say whether this game counts. */
/// `stake` is null once the game is over: the frame then describes a game
/// played for the stake before its result, and the next game's is on its card.
function ModeFrame(props: { difficulty: Difficulty | null, liveNumber: number, stake: number | null, children: ReactNode }) {
  const { t } = useTranslation();
  const { difficulty } = props;
  const border = difficulty === 'live' ? `3px solid ${LIVE}`
    : difficulty === 'test' ? `3px dashed ${PRACTICE_BORDER}`
    : '1px solid #d8d3c4';
  return (
    <Box sx={{ border, borderRadius: '20px', overflow: 'hidden', backgroundColor: '#fff' }}>
      {difficulty !== null && <Stack sx={{
        flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: '8px 24px', padding: '12px 20px',
        ...(difficulty === 'live' ? { backgroundColor: LIVE, color: '#fff' } : { background: PRACTICE_STRIPES, color: '#1e293b' }),
      }}>
        <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          {difficulty === 'live'
            ? <FlagOutlinedIcon aria-hidden sx={{ fontSize: '28px' }} />
            : <ScienceOutlinedIcon aria-hidden sx={{ fontSize: '28px', color: PRACTICE }} />}
          <Stack>
            <Box sx={{ fontSize: '19px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {difficulty === 'live' ? t('strategy.mode.live') : t('strategy.mode.practice')}
            </Box>
            <Box sx={{ fontSize: '14px' }}>
              {difficulty === 'live' ? t('strategy.mode.liveNumber', { n: props.liveNumber }) : t('strategy.mode.practiceSub')}
            </Box>
          </Stack>
        </Stack>
        {(difficulty === 'test' || props.stake !== null) &&
          <Box sx={{ backgroundColor: '#fff', borderRadius: '12px', padding: '6px 14px', fontWeight: 600,
            color: difficulty === 'live' ? LIVE_TEXT : '#1e293b' }}>
            {difficulty === 'live'
              ? t('strategy.mode.stake', { points: t('general.points', { count: props.stake }) })
              : t('strategy.mode.practiceKeeps')}
          </Box>}
      </Stack>}
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
  return (
    <Stack sx={{ gap: '12px', backgroundColor: practice ? PRACTICE_TINT : LIVE_TINT, borderRadius: '14px', padding: '16px' }}>
      <Box sx={{ fontSize: '13px', fontWeight: 600, color: practice ? PRACTICE : LIVE_TEXT, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {practice ? t('strategy.goal.titlePractice') : t('strategy.goal.title')}
      </Box>
      <Box sx={{ fontSize: '17px', fontWeight: 600, lineHeight: 1.35 }}>{t('strategy.goal.text')}</Box>
      <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
        <StreakSlot won={G.winningStreak >= 1} label="1" practice={practice} />
        <Box sx={{ width: '18px', height: '3px', backgroundColor: practice ? '#cbd5e1' : '#e8b79a' }} />
        <StreakSlot won={false} label="2" practice={practice} />
        <Box sx={{ fontSize: '15px', marginLeft: '6px' }}>
          {G.winningStreak >= 1 ? t('strategy.goal.oneMore') : t('strategy.goal.twoMore')}
        </Box>
      </Stack>
      <Box sx={{ fontSize: '14px', color: MUTED, lineHeight: 1.4 }}>
        {t('strategy.goal.stake', { points: t('general.points', { count: stake }) })}{' '}
        {stakeAfterLoss < stake
          ? t('strategy.goal.ifLoseDrop', { points: t('general.points', { count: stakeAfterLoss }) })
          : t('strategy.goal.ifLose')}
      </Box>
      {G.liveResults.length > 0 && <StrategyGamesTable results={G.liveResults} />}
    </Stack>
  );
}

function StreakSlot(props: { won: boolean, label: string, practice: boolean }) {
  const { t } = useTranslation();
  const size = '44px';
  return props.won
    ? <Box role="img" aria-label={t('strategy.goal.firstWin')} sx={{
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
      {!live && result === 'won' && <PracticeWarning />}
    </Stack>
  );
}

/// Two cards rather than two alike buttons: what each kind of game counts for,
/// and what a live one would change, sit next to the button that starts it.
function ModeChooser(props: { G: GameStateMixin, moves: StrategyWrapperMoves, enabled: boolean, starting: Difficulty | null }) {
  const { t } = useTranslation();
  const { G, moves, enabled, starting } = props;
  const stake = strategyPoints(G.numberOfLoss);
  const stakeAfterLoss = strategyPoints(G.numberOfLoss + 1);
  const ifWin = G.winningStreak >= 1
    ? t('strategy.chooser.liveIfWinDone', { points: t('general.points', { count: stake }) })
    : t('strategy.chooser.liveIfWinFirst');
  const ifLose = stakeAfterLoss < stake
    ? t('strategy.chooser.liveIfLoseDrop', { points: t('general.points', { count: stakeAfterLoss }) })
    : t('strategy.chooser.liveIfLose');
  return (
    <Stack sx={{ gap: '10px' }}>
      <Box sx={{ fontSize: '20px', fontWeight: 700 }}>{t('strategy.chooser.title')}</Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '14px' }}>
        <ModeCard
          live={false}
          title={t('strategy.mode.practice')}
          subtitle={t('strategy.mode.practiceSub')}
          points={[t('strategy.chooser.practiceSame'), t('strategy.chooser.practiceKeeps')]}
          note={<><b>{t('strategy.practiceWarning.title')}</b> {t('strategy.practiceWarning.text')}</>}
          button={starting === 'test' ? t('strategy.chooser.starting') : t('strategy.chooser.practiceButton')}
          enabled={enabled}
          onClick={() => moves.chooseNewGameType('test')}
        />
        <ModeCard
          live
          title={t('strategy.mode.live')}
          subtitle={t('strategy.chooser.liveSub')}
          points={[ifWin, ifLose]}
          button={starting === 'live' ? t('strategy.chooser.starting') : t('strategy.chooser.liveButton')}
          enabled={enabled}
          onClick={() => moves.chooseNewGameType('live')}
        />
      </Box>
      <Box sx={{ fontSize: '14px', color: MUTED }}>{t('strategy.chooser.noAbandon')}</Box>
    </Stack>
  );
}

function ModeCard(props: {
  live: boolean, title: string, subtitle: string, points: string[], note?: ReactNode,
  button: string, enabled: boolean, onClick: () => void,
}) {
  const { live } = props;
  return (
    <Stack sx={{
      border: live ? `3px solid ${LIVE}` : `3px dashed ${PRACTICE_BORDER}`, borderRadius: '16px',
      padding: '16px', gap: '10px', backgroundColor: '#fff',
    }}>
      <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
        {live
          ? <FlagOutlinedIcon aria-hidden sx={{ color: LIVE, fontSize: '30px' }} />
          : <ScienceOutlinedIcon aria-hidden sx={{ color: PRACTICE, fontSize: '30px' }} />}
        <Stack>
          <Box sx={{ fontSize: '20px', fontWeight: 700 }}>{props.title}</Box>
          <Box sx={{ fontSize: '14px', fontWeight: 600, color: live ? LIVE_TEXT : PRACTICE }}>{props.subtitle}</Box>
        </Stack>
      </Stack>
      <Box component="ul" sx={{ margin: 0, paddingLeft: '20px', fontSize: '15px', lineHeight: 1.45 }}>
        {props.points.map(point => <li key={point}>{point}</li>)}
      </Box>
      {props.note && <Box sx={{ fontSize: '14px', lineHeight: 1.45, backgroundColor: PRACTICE_TINT, borderRadius: '10px', padding: '8px 12px' }}>
        {props.note}
      </Box>}
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
