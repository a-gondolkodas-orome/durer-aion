// @vitest-environment jsdom
import { render, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { strategyGameFactory, type StrategyGameConfig } from '../strategy-game-factory';
import { runMatch } from './run-match';
import type { BotMove, BotStrategy, Ctx, Gameplay, MoveOutcome } from '../types';

// The React shell and the headless runner play a named turn out separately —
// one paced by a timer, one straight through. What they must never disagree on
// is *which* moves get played. This plays the same turn through both and
// compares; it is the standing check behind engine/bot-turn.ts, where the
// sequencing decisions live precisely so that these two cannot drift apart.

type Board = number

// A turn is three takes long: the move keeps the turn open until the third, and
// the sixth take ends the game so a headless match terminates.
const makeGameplay = (log: string[], winsOnSecond = false): Gameplay<Board> => ({
  moves: {
    take: {
      apply: (board: Board, { ctx }: { ctx: Ctx }, mark: string): MoveOutcome<Board> => {
        log.push(mark);
        const nextBoard = board + 1;
        if (winsOnSecond && nextBoard === 2) {
          return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
        }
        if (nextBoard === 6) return { nextBoard, gameEnd: { winnerIndex: ctx.currentPlayer! } };
        if (nextBoard % 3 === 0) return { nextBoard, isTurnEnd: true };
        return { nextBoard };
      }
    }
  }
});

const wholeTurn: BotMove[] = [
  { move: 'take', args: ['a'] }, { move: 'take', args: ['b'] }, { move: 'take', args: ['c'] }
];

// Two shapes the bot contract allows: name the whole turn, or name one move and
// be asked again while the turn is still yours.
const namesWholeTurn: BotStrategy<Board> = () => wholeTurn;
const namesOneAtATime: BotStrategy<Board> = ({ board }) => wholeTurn[board % 3]!;

const BoardClient = () => <div data-testid="board" />;

const shellConfig = (
  gameplay: Gameplay<Board>, botStrategy: BotStrategy<Board>
): StrategyGameConfig<Board> => ({
  presentation: { rule: <></>, getPlayerStepDescription: () => '' },
  BoardClient,
  gameplay,
  variants: [{ botStrategy, generateStartBoard: (): Board => 0 }]
});

// The bot's opening turn as the browser plays it: the human takes seat 1, so
// the bot holds seat 0 and moves first. The human never answers, so what the
// log holds afterwards is exactly that one turn.
const playOpeningTurnInShell = (gameplay: Gameplay<Board>, strategy: BotStrategy<Board>) => {
  const Game = strategyGameFactory(shellConfig(gameplay, strategy));
  const { getByTestId } = render(<MemoryRouter><Game /></MemoryRouter>);
  fireEvent.click(getByTestId('role-btn-1'));
  // a beat per move, plus room for the ask-again round trips
  act(() => { vi.advanceTimersByTime(6000); });
};

const playHeadless = (gameplay: Gameplay<Board>, strategy: BotStrategy<Board>) => {
  runMatch({ gameplay, strategies: [strategy, strategy], startBoard: 0 });
};

beforeEach(() => {
  vi.useFakeTimers();
  // stepDelay() spreads the beat; pinning it keeps the timer advance exact
  vi.spyOn(Math, 'random').mockReturnValue(0);
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe.each([
  ['a turn named whole', namesWholeTurn],
  ['a turn named one move at a time', namesOneAtATime]
])('%s', (_name, strategy) => {
  it('plays the same moves in the shell as headless', () => {
    const headlessLog: string[] = [];
    playHeadless(makeGameplay(headlessLog), strategy);

    const shellLog: string[] = [];
    playOpeningTurnInShell(makeGameplay(shellLog), strategy);

    expect(shellLog).toEqual(['a', 'b', 'c']);
    // the headless match plays on past the opening turn; its first three are it
    expect(headlessLog.slice(0, 3)).toEqual(shellLog);
  });
});

// The interesting divergence risk: a planned turn that wins partway leaves
// moves behind, and both callers have to drop them rather than call it a bug.
describe('a turn that wins partway through', () => {
  it('drops the moves the win made moot, in both', () => {
    const headlessLog: string[] = [];
    playHeadless(makeGameplay(headlessLog, true), namesWholeTurn);

    const shellLog: string[] = [];
    playOpeningTurnInShell(makeGameplay(shellLog, true), namesWholeTurn);

    expect(shellLog).toEqual(['a', 'b']);
    expect(headlessLog).toEqual(shellLog);
  });
});
