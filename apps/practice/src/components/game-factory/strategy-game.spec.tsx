// @vitest-environment jsdom
import { render, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { strategyGameFactory, type StrategyGameConfig, type Gameplay } from './strategy-game';
import type { BoardClientProps, Ctx, Events, GameMoves } from './types';

type Board = string[];

beforeAll(() => {
  const { getByTestId, unmount } = renderGame(ctxAwareConfig());
  fireEvent.click(getByTestId('mode-vsHuman')); // warms up PlayerNameSetup (Headless UI)
  unmount();
});

const MinimalBoardClient = ({ board, moves }: BoardClientProps<Board>) => (
  <button data-testid="move-btn" onClick={() => moves.mainMove(board)}>move</button>
);

const CtxAwareBoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => (
  <button
    data-testid="move-btn"
    disabled={!ctx.isClientMoveAllowed}
    onClick={() => moves.mainMove(board)}
  >move</button>
);

const defaultGameplay: Gameplay<Board> = {
  moves: {
    mainMove: (board: Board, { events }: { events: Events }) => {
      events.endTurn();
      return { nextBoard: board };
    }
  }
};

const makeConfig = ({
  BoardClient = MinimalBoardClient,
  gameplay = defaultGameplay,
  botStrategy = () => {}
}: {
  BoardClient?: StrategyGameConfig<Board>['BoardClient']
  gameplay?: Gameplay<Board>
  botStrategy?: () => void
} = {}): StrategyGameConfig<Board> => ({
  presentation: { rule: <></>, getPlayerStepDescription: () => '' },
  BoardClient,
  gameplay,
  variants: [{ botStrategy, generateStartBoard: (): Board => ['initial'] }]
});

const minimalConfig = (gameplay: Gameplay<Board>) => makeConfig({ gameplay });
const ctxAwareConfig = (botStrategy: () => void = () => {}) =>
  makeConfig({ BoardClient: CtxAwareBoardClient, botStrategy });

const renderGame = (config: StrategyGameConfig<Board>) => {
  const Game = strategyGameFactory(config);
  return render(<MemoryRouter><Game /></MemoryRouter>);
};

describe('isClientMoveAllowed', () => {
  it('allows both players to move in vsHuman mode', () => {
    const { getByTestId } = renderGame(ctxAwareConfig());
    fireEvent.click(getByTestId('mode-vsHuman'));
    expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(getByTestId('start-hh-game-0'));
    expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(getByTestId('move-btn')); // endTurn → currentPlayer 1
    expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(false);
  });

  it('disables moves during the computer turn in vsComputer mode', () => {
    const { getByTestId } = renderGame(ctxAwareConfig());
    fireEvent.click(getByTestId('role-btn-0'));
    expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(getByTestId('move-btn')); // endTurn → bot's turn
    expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('Bot behavior by mode', () => {
  beforeAll(() => { vi.useFakeTimers(); });
  afterAll(() => { vi.useRealTimers(); });
  afterEach(() => { vi.clearAllTimers(); });

  it('does not call botStrategy in vsHuman mode', () => {
    const botStrategy = vi.fn();
    const { getByTestId } = renderGame(ctxAwareConfig(botStrategy));
    fireEvent.click(getByTestId('mode-vsHuman'));
    fireEvent.click(getByTestId('start-hh-game-0'));
    fireEvent.click(getByTestId('move-btn')); // endTurn → currentPlayer 1
    act(() => { vi.advanceTimersByTime(1500); });
    expect(botStrategy).not.toHaveBeenCalled();
  });

  it('calls botStrategy when it becomes the computer turn', () => {
    const botStrategy = vi.fn();
    const { getByTestId } = renderGame(ctxAwareConfig(botStrategy));
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('move-btn')); // endTurn → bot's turn
    act(() => { vi.advanceTimersByTime(1500); });
    expect(botStrategy).toHaveBeenCalledOnce();
  });
});

describe('switchMode', () => {
  it('resets to roleSelection when switching mode during play', () => {
    const { getByTestId } = renderGame(ctxAwareConfig());
    fireEvent.click(getByTestId('role-btn-0'));
    expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(getByTestId('mode-vsHuman'));
    expect(getByTestId('start-hh-game-0')).toBeTruthy();
  });

  it('resets to roleSelection when switching back to vsComputer', () => {
    const { getByTestId } = renderGame(ctxAwareConfig());
    fireEvent.click(getByTestId('mode-vsHuman'));
    fireEvent.click(getByTestId('start-hh-game-0'));
    fireEvent.click(getByTestId('move-btn'));
    fireEvent.click(getByTestId('mode-vsComputer'));
    expect(getByTestId('role-btn-0')).toBeTruthy();
  });
});

describe('strategyGameFactory endOfTurnMove', () => {
  beforeAll(() => { vi.useFakeTimers(); });
  afterAll(() => { vi.useRealTimers(); });
  afterEach(() => { vi.clearAllTimers(); });

  it('calls endOfTurnMove after 750ms when a move returns autoEndOfTurn: true', () => {
    const autoMove = vi.fn((board: Board) => ({ nextBoard: board }));
    const moves: GameMoves<Board> = {
      mainMove: (board, { events }: { events: Events }) => {
        events.endTurn();
        return { nextBoard: board, autoEndOfTurn: true };
      },
      autoMove
    };

    const { getByTestId } = renderGame(minimalConfig({ moves, endOfTurnMove: 'autoMove' }));
    fireEvent.click(getByTestId('move-btn'));

    expect(autoMove).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(750); });

    expect(autoMove).toHaveBeenCalledOnce();
  });

  it('does not call endOfTurnMove when a move does not return autoEndOfTurn', () => {
    const autoMove = vi.fn((board: Board) => ({ nextBoard: board }));
    const moves: GameMoves<Board> = {
      mainMove: (board, { events }: { events: Events }) => {
        events.endTurn();
        return { nextBoard: board };
      },
      autoMove
    };

    const { getByTestId } = renderGame(minimalConfig({ moves, endOfTurnMove: 'autoMove' }));
    fireEvent.click(getByTestId('move-btn'));
    act(() => { vi.advanceTimersByTime(750); });

    expect(autoMove).not.toHaveBeenCalled();
  });
});

describe('undo', () => {
  describe('vsHuman', () => {
    it('undo button is disabled before any move', () => {
      const { getByTestId } = renderGame(ctxAwareConfig());
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(true);
    });

    it('undo button is enabled after a move', () => {
      const { getByTestId } = renderGame(ctxAwareConfig());
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      fireEvent.click(getByTestId('move-btn'));
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(false);
    });

    it('clicking undo restores the previous board and player', () => {
      const gameplay: Gameplay<Board> = {
        moves: {
          mainMove: (board: Board, { events }: { events: Events }) => {
            events.endTurn();
            return { nextBoard: [...board, 'moved'] };
          }
        }
      };
      const { getByTestId } = renderGame(makeConfig({ BoardClient: CtxAwareBoardClient, gameplay }));
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      fireEvent.click(getByTestId('move-btn')); // player 0 moves → player 1's turn
      expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(false); // player 1 can move
      fireEvent.click(getByTestId('undo-btn')); // undo → back to player 0's turn
      expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(false); // player 0 can move
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(true);  // snapshot cleared
    });

    it('undo is disabled after use (snapshot cleared)', () => {
      const { getByTestId } = renderGame(ctxAwareConfig());
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      fireEvent.click(getByTestId('move-btn'));
      fireEvent.click(getByTestId('undo-btn'));
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(true);
    });

    it('a new move after undo re-enables undo', () => {
      const { getByTestId } = renderGame(ctxAwareConfig());
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      fireEvent.click(getByTestId('move-btn'));
      fireEvent.click(getByTestId('undo-btn'));
      fireEvent.click(getByTestId('move-btn')); // make a new move
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(false);
    });

    it('resetGameState clears the undo snapshot', () => {
      const { getByTestId } = renderGame(ctxAwareConfig());
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      fireEvent.click(getByTestId('move-btn')); // creates snapshot
      fireEvent.click(getByTestId('new-game-btn')); // reset
      fireEvent.click(getByTestId('start-hh-game-0'));
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(true);
    });

    it('undo is enabled mid-turn (after first move but before endTurn)', () => {
      const gameplay: Gameplay<Board> = {
        moves: {
          mainMove: (board: Board, { events }: { events: Events }) => {
            events.setTurnState('step2');
            return { nextBoard: board };
          }
        }
      };
      const { getByTestId } = renderGame(makeConfig({ BoardClient: CtxAwareBoardClient, gameplay }));
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      fireEvent.click(getByTestId('move-btn')); // sets turnState = 'step2', no endTurn
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(false);
    });
  });

  describe('vsComputer', () => {
    beforeAll(() => { vi.useFakeTimers(); });
    afterAll(() => { vi.useRealTimers(); });
    afterEach(() => { vi.clearAllTimers(); });

    it('undo enabled immediately after human move (before bot fires)', () => {
      const botStrategy = vi.fn();
      const { getByTestId } = renderGame(ctxAwareConfig(botStrategy));
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('move-btn')); // human moves
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(false);
    });

    it('clicking undo before bot fires cancels bot and restores human turn', () => {
      const botStrategy = vi.fn();
      const { getByTestId } = renderGame(ctxAwareConfig(botStrategy));
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('move-btn')); // human moves → bot thinking
      fireEvent.click(getByTestId('undo-btn'));  // undo before bot fires
      act(() => { vi.advanceTimersByTime(1500); }); // bot timeout should be canceled
      expect(botStrategy).not.toHaveBeenCalled();
      expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(false); // human's turn
    });

    it('undo disabled after bot completes its move', () => {
      const botStrategy = vi.fn().mockImplementation((args: any) => { args.moves.mainMove(args.board); });
      const { getByTestId } = renderGame(ctxAwareConfig(botStrategy));
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('move-btn')); // human moves
      act(() => { vi.advanceTimersByTime(1500); }); // bot fires and calls mainMove
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(true);
    });

    it('undo does not re-trigger bot after restoring human turn', () => {
      const botStrategy = vi.fn();
      const { getByTestId } = renderGame(ctxAwareConfig(botStrategy));
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('move-btn')); // human moves → bot thinking
      fireEvent.click(getByTestId('undo-btn'));  // undo
      act(() => { vi.advanceTimersByTime(1500); }); // advance timers
      expect(botStrategy).not.toHaveBeenCalled(); // bot never fired
    });
  });
});

const gameEndingConfig = () => makeConfig({
  BoardClient: ({ board, moves }: BoardClientProps<Board>) => (
    <>
      <button data-testid="end-win-btn" onClick={() => moves.endWin(board)}>win</button>
      <button data-testid="end-lose-btn" onClick={() => moves.endLose(board)}>lose</button>
    </>
  ),
  gameplay: {
    moves: {
      endWin: (board: Board, { ctx, events }: { ctx: Ctx; events: Events }) => {
        events.endGame(ctx.currentPlayer);
        return { nextBoard: board };
      },
      endLose: (board: Board, { ctx, events }: { ctx: Ctx; events: Events }) => {
        events.endGame(ctx.currentPlayer === 0 ? 1 : 0);
        return { nextBoard: board };
      }
    }
  }
});

describe('win/loss tracking', () => {
  beforeEach(() => { localStorage.clear(); });

  it('records a win when the chosen player wins in vsComputer mode', () => {
    const { getByTestId } = renderGame(gameEndingConfig());
    fireEvent.click(getByTestId('role-btn-0')); // choose first player (index 0 = currentPlayer 0)
    fireEvent.click(getByTestId('end-win-btn')); // currentPlayer wins = player wins
    const stats = JSON.parse(localStorage.getItem('stats__0')!);
    expect(stats).toEqual({ win: 1, loss: 0 });
  });

  it('records a loss when the opponent wins in vsComputer mode', () => {
    const { getByTestId } = renderGame(gameEndingConfig());
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('end-lose-btn')); // other player wins = player loses
    const stats = JSON.parse(localStorage.getItem('stats__0')!);
    expect(stats).toEqual({ win: 0, loss: 1 });
  });

  it('does not record in localStorage in vsHuman mode', () => {
    const { getByTestId } = renderGame(gameEndingConfig());
    fireEvent.click(getByTestId('mode-vsHuman'));
    fireEvent.click(getByTestId('start-hh-game-0'));
    fireEvent.click(getByTestId('end-win-btn'));
    expect(localStorage.getItem('stats__0')).toBeNull();
  });

  it('accumulates results across multiple games', () => {
    const { getByTestId, unmount } = renderGame(gameEndingConfig());
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('end-win-btn')); // win
    unmount();

    const { getByTestId: g2 } = renderGame(gameEndingConfig());
    fireEvent.click(g2('role-btn-0'));
    fireEvent.click(g2('end-lose-btn')); // loss

    const stats = JSON.parse(localStorage.getItem('stats__0')!);
    expect(stats).toEqual({ win: 1, loss: 1 });
  });
});
