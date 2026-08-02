// @vitest-environment jsdom
import { render, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { strategyGameFactory, type StrategyGameConfig } from './strategy-game-factory';
import type {
  BoardClientProps, Ctx, Events, Gameplay, GameMoves, MoveDefinition, StrategyArgs
} from './types';

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
  botStrategy?: (args: StrategyArgs<Board>) => void
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
    fireEvent.click(getByTestId('role-btn-0'));
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
    fireEvent.click(getByTestId('role-btn-0'));
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
      const BoardWithDisplay = ({ board, ctx, moves }: BoardClientProps<Board>) => (
        <button
          data-testid="move-btn"
          disabled={!ctx.isClientMoveAllowed}
          onClick={() => moves.mainMove(board)}
        >{board.join(',')}</button>
      );
      const gameplay: Gameplay<Board> = {
        moves: {
          mainMove: (board: Board, { events }: { events: Events }) => {
            events.endTurn();
            return { nextBoard: [...board, 'moved'] };
          }
        }
      };
      const { getByTestId } = renderGame(makeConfig({ BoardClient: BoardWithDisplay, gameplay }));
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      expect(getByTestId('move-btn').textContent).toBe('initial'); // start board
      fireEvent.click(getByTestId('move-btn')); // player 0 moves → player 1's turn
      expect(getByTestId('move-btn').textContent).toBe('initial,moved'); // board advanced
      expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(false); // player 1 can move
      fireEvent.click(getByTestId('undo-btn')); // undo → back to player 0's turn
      expect(getByTestId('move-btn').textContent).toBe('initial'); // board restored
      expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(false); // player 0 can move
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(true);  // snapshot cleared
    });

    it('clicking undo restores moveCount', () => {
      const BoardWithCount = ({ board, ctx, moves }: BoardClientProps<Board>) => (
        <button
          data-testid="move-btn"
          disabled={!ctx.isClientMoveAllowed}
          onClick={() => moves.mainMove(board)}
        >count:{ctx.moveCount}</button>
      );
      const { getByTestId } = renderGame(makeConfig({ BoardClient: BoardWithCount }));
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      expect(getByTestId('move-btn').textContent).toBe('count:0');
      fireEvent.click(getByTestId('move-btn')); // moveCount → 1
      expect(getByTestId('move-btn').textContent).toBe('count:1');
      fireEvent.click(getByTestId('undo-btn')); // undo → moveCount back to 0
      expect(getByTestId('move-btn').textContent).toBe('count:0');
    });

    it('undo restores moveCount to the start of a multi-move turn', () => {
      // A turn with two moves before endTurn: undo must roll moveCount back by both.
      const gameplay: Gameplay<Board> = {
        moves: {
          mainMove: (board: Board, { events }: { events: Events }) => {
            events.setTurnState('step2');
            return { nextBoard: board };
          },
          secondMove: (board: Board, { events }: { events: Events }) => {
            events.endTurn();
            return { nextBoard: board };
          }
        }
      };
      const BoardWithCount = ({ board, ctx, moves }: BoardClientProps<Board>) => (
        <>
          <button data-testid="move-btn" onClick={() => moves.mainMove(board)}>count:{ctx.moveCount}</button>
          <button data-testid="second-btn" onClick={() => moves.secondMove(board)}>second</button>
        </>
      );
      const { getByTestId } = renderGame(makeConfig({ BoardClient: BoardWithCount, gameplay }));
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      fireEvent.click(getByTestId('move-btn')); // moveCount → 1, snapshot taken at 0
      fireEvent.click(getByTestId('second-btn')); // moveCount → 2, same turn
      expect(getByTestId('move-btn').textContent).toBe('count:2');
      fireEvent.click(getByTestId('undo-btn')); // undo whole turn → moveCount back to 0
      expect(getByTestId('move-btn').textContent).toBe('count:0');
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

describe('per-variant rule', () => {
  it('shows the default variant rule and switches when another variant is selected', () => {
    const config: StrategyGameConfig<Board> = {
      presentation: { rule: { hu: 'TOP_RULE', en: 'TOP_RULE' }, getPlayerStepDescription: () => '' },
      BoardClient: MinimalBoardClient,
      gameplay: defaultGameplay,
      variants: [
        {
          botStrategy: () => {},
          generateStartBoard: (): Board => ['a'],
          rule: { hu: 'RULE_ONE', en: 'RULE_ONE' },
          isDefault: true
        },
        {
          rule: { hu: 'RULE_TWO', en: 'RULE_TWO' }
        }
      ]
    };
    const { getByText, queryByText, container } = renderGame(config);
    expect(getByText('RULE_ONE')).toBeTruthy();
    expect(queryByText('RULE_TWO')).toBeNull();

    const radios = container.querySelectorAll('input[name="difficulty"]');
    fireEvent.click(radios[1]);

    expect(getByText('RULE_TWO')).toBeTruthy();
    expect(queryByText('RULE_ONE')).toBeNull();
  });

  it('falls back to presentation.rule when the active variant has no rule', () => {
    const config: StrategyGameConfig<Board> = {
      presentation: { rule: { hu: 'TOP_RULE', en: 'TOP_RULE' }, getPlayerStepDescription: () => '' },
      BoardClient: MinimalBoardClient,
      gameplay: defaultGameplay,
      variants: [
        {
          botStrategy: () => {},
          generateStartBoard: (): Board => ['a'],
          isDefault: true
        },
        {
          botStrategy: () => {},
          generateStartBoard: (): Board => ['b'],
          rule: { hu: 'RULE_TWO', en: 'RULE_TWO' }
        }
      ]
    };
    const { getByText } = renderGame(config);
    expect(getByText('TOP_RULE')).toBeTruthy();
  });
});

describe('umami game-finished event', () => {
  let track: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    track = vi.fn();
    window.umami = { track: track as NonNullable<Window['umami']>['track'] };
  });

  afterEach(() => { delete window.umami; });

  const lastEvent = () => track.mock.calls.at(-1)!;

  it('fires with result "win" when the chosen player wins vs computer', () => {
    const { getByTestId } = renderGame(gameEndingConfig());
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('end-win-btn'));
    expect(lastEvent()[0]).toBe('game-finished');
    expect(lastEvent()[1]).toMatchObject({ mode: 'vsComputer', result: 'win' });
  });

  it('fires with result "loss" when the opponent wins vs computer', () => {
    const { getByTestId } = renderGame(gameEndingConfig());
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('end-lose-btn'));
    expect(lastEvent()[1]).toMatchObject({ mode: 'vsComputer', result: 'loss' });
  });

  it('fires without a result in vsHuman mode', () => {
    const { getByTestId } = renderGame(gameEndingConfig());
    fireEvent.click(getByTestId('mode-vsHuman'));
    fireEvent.click(getByTestId('start-hh-game-0'));
    fireEvent.click(getByTestId('end-win-btn'));
    expect(lastEvent()[0]).toBe('game-finished');
    expect(lastEvent()[1]).toMatchObject({ mode: 'vsHuman' });
    expect(lastEvent()[1]).not.toHaveProperty('result');
  });
});

describe('move validate enforcement', () => {
  const guardedConfig = (botStrategy: () => void = () => {}) => makeConfig({
    BoardClient: ({ board, moves }: BoardClientProps<Board>) => (
      <>
        <button data-testid="legal-btn" onClick={() => moves.guarded(board, 'ok')}>legal</button>
        <button data-testid="illegal-btn" onClick={() => moves.guarded(board, 'bad')}>illegal</button>
        <button data-testid="hand-over-btn" onClick={() => moves.handOver(board)}>hand over</button>
        <span data-testid="board">{board.join(',')}</span>
        <span data-testid="can-ok">{String(moves.guarded.isAllowed!(board, 'ok'))}</span>
        <span data-testid="can-bad">{String(moves.guarded.isAllowed!(board, 'bad'))}</span>
      </>
    ),
    gameplay: {
      moves: {
        guarded: {
          legacyApply: (board: Board, _meta: { events: Events }, arg: string) => ({ nextBoard: [...board, arg] }),
          validate: (_board: Board, _meta: { ctx: Ctx }, arg: string) => arg === 'ok'
        },
        handOver: (board: Board, { events }: { events: Events }) => {
          events.endTurn();
          return { nextBoard: board };
        }
      }
    },
    botStrategy
  });

  it('applies a client dispatch whose args pass its validator', () => {
    const { getByTestId } = renderGame(guardedConfig());
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('legal-btn'));
    expect(getByTestId('board').textContent).toBe('initial,ok');
  });

  it('silently ignores a client dispatch whose args fail the validator', () => {
    const { getByTestId } = renderGame(guardedConfig());
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('illegal-btn')); // must not throw
    expect(getByTestId('board').textContent).toBe('initial');
  });

  it('silently ignores a client dispatch when it is not the client turn', () => {
    const { getByTestId } = renderGame(guardedConfig());
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('hand-over-btn')); // endTurn → bot's turn
    fireEvent.click(getByTestId('legal-btn')); // legal args, wrong turn
    expect(getByTestId('board').textContent).toBe('initial');
  });

  it('silently ignores a client dispatch before the game starts', () => {
    const { getByTestId } = renderGame(guardedConfig());
    fireEvent.click(getByTestId('legal-btn'));
    expect(getByTestId('board').textContent).toBe('initial');
  });

  it('throws a loud error in dev when a bot dispatches a move that fails its validator', () => {
    vi.useFakeTimers();
    try {
      const botStrategy = vi.fn().mockImplementation((args: any) => { args.moves.guarded(args.board, 'bad'); });
      const { getByTestId } = renderGame(guardedConfig(botStrategy));
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('hand-over-btn')); // → bot's turn
      expect(() => act(() => { vi.advanceTimersByTime(1500); })).toThrow(/illegal move/);
      expect(getByTestId('board').textContent).toBe('initial'); // threw before touching the board
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('exposes isAllowed on the wrapped move: turn ownership AND the validator, ctx bound', () => {
    const { getByTestId } = renderGame(guardedConfig());
    // outside the play phase nothing is dispatchable, even with legal args
    expect(getByTestId('can-ok').textContent).toBe('false');
    fireEvent.click(getByTestId('role-btn-0'));
    expect(getByTestId('can-ok').textContent).toBe('true');
    expect(getByTestId('can-bad').textContent).toBe('false');
  });

  it('runs a plain-function (shorthand) move unchanged — no validator', () => {
    // defaultGameplay uses the function shorthand, so mainMove applies + endTurn as before
    const { getByTestId } = renderGame(ctxAwareConfig());
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('move-btn'));
    expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(true); // bot's turn now
  });

  // Mirrors the coins-in-3-piles bots: a two-phase turn chained via setTimeout
  // on the move wrappers captured when the bot's turn started. The phase-2
  // validator reads ctx.turnState, which phase 1 just set — the engine must
  // judge it against the current game state, not the render the wrappers came
  // from. The 0-delay variant (smartBotStrategy's "place back nothing" branch)
  // is the harshest case: phase 2 dispatches before React re-renders at all.
  const twoPhaseBotConfig = (chainDelayMs: number) => makeConfig({
    BoardClient: ({ board }: BoardClientProps<Board>) => (
      <span data-testid="board">{board.join(',')}</span>
    ),
    gameplay: {
      moves: {
        phase1: {
          validate: (_board: Board, { ctx }: { ctx: Ctx }) => ctx.turnState === null,
          legacyApply: (board: Board, { events }: { events: Events }) => {
            events.setTurnState({ removedCoinValue: 3 });
            return { nextBoard: [...board, 'p1'] };
          }
        },
        phase2: {
          validate: (_board: Board, { ctx }: { ctx: Ctx }) => ctx.turnState !== null,
          legacyApply: (board: Board, { events }: { events: Events }) => {
            events.endTurn();
            events.setTurnState(null);
            return { nextBoard: [...board, 'p2'] };
          }
        }
      }
    },
    botStrategy: ({ board, moves }) => {
      const { nextBoard } = moves.phase1(board);
      setTimeout(() => { moves.phase2(nextBoard); }, chainDelayMs);
    }
  });

  const playTwoPhaseBotTurn = (chainDelayMs: number) => {
    vi.useFakeTimers();
    try {
      const { getByTestId } = renderGame(twoPhaseBotConfig(chainDelayMs));
      fireEvent.click(getByTestId('role-btn-1')); // human is 2nd player → bot moves first
      act(() => { vi.advanceTimersByTime(1500); }); // bot "thinking" delay → phase1
      act(() => { vi.advanceTimersByTime(750); }); // the chained phase2 — must not be rejected
      return getByTestId('board').textContent;
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  };

  it('validates a bot-chained second move against current turnState, not a stale render', () => {
    expect(playTwoPhaseBotTurn(750)).toBe('initial,p1,p2');
  });

  it('validates a 0-delay chained second move dispatched before React re-renders', () => {
    expect(playTwoPhaseBotTurn(0)).toBe('initial,p1,p2');
  });

  describe('in production (import.meta.env.DEV = false)', () => {
    beforeEach(() => { vi.stubEnv('DEV', false); vi.useFakeTimers(); });
    afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); });

    const illegalBotStrategy = () =>
      vi.fn().mockImplementation((args: any) => { args.moves.guarded(args.board, 'bad'); });

    it('does not throw and leaves the board unchanged on an illegal bot move', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { getByTestId } = renderGame(guardedConfig(illegalBotStrategy()));
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('hand-over-btn')); // → bot's turn
      act(() => { vi.advanceTimersByTime(1500); }); // bot dispatches 'bad' — must not throw
      expect(getByTestId('board').textContent).toBe('initial'); // no-op, not corrupted
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it('reports an illegal-move umami event', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const track = vi.fn();
      window.umami = { track: track as NonNullable<Window['umami']>['track'] };
      const { getByTestId } = renderGame(guardedConfig(illegalBotStrategy()));
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('hand-over-btn'));
      act(() => { vi.advanceTimersByTime(1500); });
      expect(track).toHaveBeenCalledWith('illegal-move', expect.objectContaining({ move: 'guarded' }));
      delete window.umami;
      vi.restoreAllMocks();
    });
  });
});

describe('outcome-returning moves (apply)', () => {
  const v2Config = () => makeConfig({
    BoardClient: ({ board, ctx, moves }: BoardClientProps<Board>) => (
      <>
        <button
          data-testid="pass-btn"
          disabled={!ctx.isClientMoveAllowed}
          onClick={() => moves.passTurn(board)}
        >pass</button>
        <button data-testid="mid-btn" onClick={() => moves.midMove(board)}>mid</button>
        <button data-testid="win-btn" onClick={() => moves.winNow(board)}>win</button>
        <button data-testid="lose-btn" onClick={() => moves.loseNow(board)}>lose</button>
        <span data-testid="board">{board.join(',')}</span>
        <span data-testid="player">{String(ctx.currentPlayer)}</span>
        <span data-testid="phase">{ctx.phase}</span>
      </>
    ),
    gameplay: {
      moves: {
        passTurn: {
          apply: (board: Board) => ({ nextBoard: [...board, 'pass'], isTurnEnd: true })
        },
        midMove: {
          apply: (board: Board) => ({ nextBoard: [...board, 'mid'] })
        },
        winNow: {
          apply: (board: Board, { ctx }: { ctx: Ctx }) =>
            ({ nextBoard: board, gameEnd: { winnerIndex: ctx.currentPlayer! } })
        },
        loseNow: {
          apply: (board: Board, { ctx }: { ctx: Ctx }) =>
            ({ nextBoard: board, gameEnd: { winnerIndex: 1 - ctx.currentPlayer! } })
        }
      }
    }
  });

  it('isTurnEnd: true passes the turn', () => {
    const { getByTestId } = renderGame(v2Config());
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('pass-btn'));
    expect(getByTestId('board').textContent).toBe('initial,pass');
    expect(getByTestId('player').textContent).toBe('1');
    expect((getByTestId('pass-btn') as HTMLButtonElement).disabled).toBe(true); // bot's turn
  });

  it('a result with no outcome fields keeps the turn (mid-turn move)', () => {
    const { getByTestId } = renderGame(v2Config());
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('mid-btn'));
    expect(getByTestId('board').textContent).toBe('initial,mid');
    expect(getByTestId('player').textContent).toBe('0');
    expect((getByTestId('pass-btn') as HTMLButtonElement).disabled).toBe(false); // still my turn
  });

  it('gameEnd ends the game with the explicit winner and does not flip currentPlayer', () => {
    localStorage.clear();
    const track = vi.fn();
    window.umami = { track: track as NonNullable<Window['umami']>['track'] };
    const { getByTestId } = renderGame(v2Config());
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('win-btn'));
    expect(getByTestId('phase').textContent).toBe('gameEnd');
    // The v2 contract never flips the player at game end (legacy games often
    // called endTurn before endGame; nothing user-visible read the flip).
    expect(getByTestId('player').textContent).toBe('0');
    expect(JSON.parse(localStorage.getItem('stats__0')!)).toEqual({ win: 1, loss: 0 });
    expect(track).toHaveBeenCalledWith('game-finished', expect.objectContaining({ result: 'win' }));
    delete window.umami;
  });

  it('gameEnd records a loss when the opponent is the explicit winner', () => {
    localStorage.clear();
    const { getByTestId } = renderGame(v2Config());
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('lose-btn'));
    expect(JSON.parse(localStorage.getItem('stats__0')!)).toEqual({ win: 0, loss: 1 });
  });

  it('throws at factory time when a move defines both legacyApply and apply, or neither', () => {
    // deliberately malformed configs, cast past the compile-time guard
    const asMove = (def: object) => def as MoveDefinition<Board>;
    const both = asMove({
      legacyApply: (board: Board) => ({ nextBoard: board }),
      apply: (board: Board) => ({ nextBoard: board })
    });
    expect(() => strategyGameFactory(minimalConfig({ moves: { broken: both } })))
      .toThrow(/exactly one of apply\/legacyApply/);
    expect(() => strategyGameFactory(minimalConfig({ moves: { broken: asMove({}) } })))
      .toThrow(/exactly one of apply\/legacyApply/);
  });

  it('throws in dev when a move returns gameEnd together with isTurnEnd', () => {
    vi.useFakeTimers();
    try {
      const config = makeConfig({
        gameplay: {
          moves: {
            contradiction: {
              apply: (board: Board) =>
                ({ nextBoard: board, isTurnEnd: true, gameEnd: { winnerIndex: 0 } })
            },
            handOver: { apply: (board: Board) => ({ nextBoard: board, isTurnEnd: true }) }
          }
        },
        BoardClient: ({ board, moves }: BoardClientProps<Board>) => (
          <button data-testid="hand-over-btn" onClick={() => moves.handOver(board)}>go</button>
        ),
        botStrategy: (({ board, moves }: StrategyArgs<Board>) => {
          moves.contradiction(board);
        }) as () => void
      });
      const { getByTestId } = renderGame(config);
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('hand-over-btn')); // → bot's turn
      expect(() => act(() => { vi.advanceTimersByTime(1500); }))
        .toThrow(/gameEnd together with isTurnEnd\/autoEndOfTurn/);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('legacy and outcome-returning moves coexist within one game', () => {
    const gameplay: Gameplay<Board> = {
      moves: {
        legacyMove: (board: Board, { events }: { events: Events }) => {
          events.endTurn();
          return { nextBoard: [...board, 'legacy'] };
        },
        v2Move: { apply: (board: Board) => ({ nextBoard: [...board, 'v2'], isTurnEnd: true }) }
      }
    };
    const BoardClient = ({ board, moves }: BoardClientProps<Board>) => (
      <>
        <button data-testid="legacy-btn" onClick={() => moves.legacyMove(board)}>legacy</button>
        <button data-testid="v2-btn" onClick={() => moves.v2Move(board)}>v2</button>
        <span data-testid="board">{board.join(',')}</span>
      </>
    );
    const { getByTestId } = renderGame(makeConfig({ BoardClient, gameplay }));
    fireEvent.click(getByTestId('mode-vsHuman'));
    fireEvent.click(getByTestId('start-hh-game-0'));
    fireEvent.click(getByTestId('v2-btn')); // player 0, v2 contract
    fireEvent.click(getByTestId('legacy-btn')); // player 1, legacy contract
    expect(getByTestId('board').textContent).toBe('initial,v2,legacy');
  });

  it('extra outcome-shaped fields returned by a legacy move stay inert', () => {
    // A legacy (events-based) game may return stray extra fields (hunyadi's
    // old isGameEnd did) — the engine must not interpret them as v2 outcomes.
    const gameplay: Gameplay<Board> = {
      moves: {
        mainMove: (board: Board) => {
          // a non-fresh object dodges the excess-property check, like real
          // legacy code returning ad-hoc extra fields did
          const strayOutcome = {
            nextBoard: [...board, 'x'], isTurnEnd: true, gameEnd: { winnerIndex: 0 }
          };
          return strayOutcome;
        }
      }
    };
    const BoardClient = ({ board, ctx, moves }: BoardClientProps<Board>) => (
      <>
        <button data-testid="move-btn" onClick={() => moves.mainMove(board)}>move</button>
        <span data-testid="player">{String(ctx.currentPlayer)}</span>
        <span data-testid="phase">{ctx.phase}</span>
      </>
    );
    const { getByTestId } = renderGame(makeConfig({ BoardClient, gameplay }));
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('move-btn'));
    expect(getByTestId('phase').textContent).toBe('play'); // gameEnd field ignored
    expect(getByTestId('player').textContent).toBe('0'); // isTurnEnd field ignored
  });

  it('autoEndOfTurn schedules an outcome-returning endOfTurnMove after 750ms', () => {
    vi.useFakeTimers();
    try {
      const autoMove = vi.fn((board: Board) => ({ nextBoard: board, isTurnEnd: true }));
      const gameplay: Gameplay<Board> = {
        moves: {
          mainMove: { apply: (board: Board) => ({ nextBoard: board, autoEndOfTurn: true }) },
          autoMove: { apply: autoMove }
        },
        endOfTurnMove: 'autoMove'
      };
      const { getByTestId } = renderGame(makeConfig({ BoardClient: CtxAwareBoardClient, gameplay }));
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('move-btn'));
      expect(autoMove).not.toHaveBeenCalled();
      act(() => { vi.advanceTimersByTime(750); });
      expect(autoMove).toHaveBeenCalledOnce();
      expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(true); // its isTurnEnd applied
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  describe('nextTurnState', () => {
    const turnStateConfig = () => makeConfig({
      BoardClient: ({ board, ctx, moves }: BoardClientProps<Board>) => (
        <>
          <button data-testid="set-btn" onClick={() => moves.setTs(board)}>set</button>
          <button data-testid="keep-btn" onClick={() => moves.keepTs(board)}>keep</button>
          <button data-testid="clear-btn" onClick={() => moves.clearTs(board)}>clear</button>
          <span data-testid="board">{board.join(',')}</span>
          <span data-testid="ts">{JSON.stringify(ctx.turnState)}</span>
        </>
      ),
      gameplay: {
        moves: {
          setTs: { apply: (board: Board) => ({ nextBoard: [...board, 's'], nextTurnState: 'stage2' }) },
          keepTs: { apply: (board: Board) => ({ nextBoard: [...board, 'k'] }) },
          clearTs: { apply: (board: Board) => ({ nextBoard: [...board, 'c'], nextTurnState: null }) }
        }
      }
    });

    it('sets, preserves (undefined) and clears (null) turnState', () => {
      const { getByTestId } = renderGame(turnStateConfig());
      fireEvent.click(getByTestId('role-btn-0'));
      expect(getByTestId('ts').textContent).toBe('null');
      fireEvent.click(getByTestId('set-btn'));
      expect(getByTestId('ts').textContent).toBe('"stage2"');
      fireEvent.click(getByTestId('keep-btn')); // omitted nextTurnState → unchanged
      expect(getByTestId('ts').textContent).toBe('"stage2"');
      fireEvent.click(getByTestId('clear-btn')); // null → cleared
      expect(getByTestId('ts').textContent).toBe('null');
    });

    it('undo mid-turn restores the board and clears turnState', () => {
      const { getByTestId } = renderGame(turnStateConfig());
      fireEvent.click(getByTestId('mode-vsHuman'));
      fireEvent.click(getByTestId('start-hh-game-0'));
      fireEvent.click(getByTestId('set-btn')); // mid-turn, turnState = 'stage2'
      fireEvent.click(getByTestId('undo-btn'));
      expect(getByTestId('board').textContent).toBe('initial');
      expect(getByTestId('ts').textContent).toBe('null');
    });
  });

  // The v2 twin of the legacy two-phase regression tests: the returned
  // nextTurnState must land in the authoritative store synchronously, or a
  // bot's 0-delay chained dispatch would be validated against a stale turnState.
  const twoPhaseV2BotConfig = (chainDelayMs: number) => makeConfig({
    BoardClient: ({ board }: BoardClientProps<Board>) => (
      <span data-testid="board">{board.join(',')}</span>
    ),
    gameplay: {
      moves: {
        phase1: {
          validate: (_board: Board, { ctx }: { ctx: Ctx }) => ctx.turnState === null,
          apply: (board: Board) =>
            ({ nextBoard: [...board, 'p1'], nextTurnState: { removedCoinValue: 3 } })
        },
        phase2: {
          validate: (_board: Board, { ctx }: { ctx: Ctx }) => ctx.turnState !== null,
          apply: (board: Board) =>
            ({ nextBoard: [...board, 'p2'], isTurnEnd: true, nextTurnState: null })
        }
      }
    },
    botStrategy: ({ board, moves }) => {
      const { nextBoard } = moves.phase1(board);
      setTimeout(() => { moves.phase2(nextBoard); }, chainDelayMs);
    }
  });

  const playTwoPhaseV2BotTurn = (chainDelayMs: number) => {
    vi.useFakeTimers();
    try {
      const { getByTestId } = renderGame(twoPhaseV2BotConfig(chainDelayMs));
      fireEvent.click(getByTestId('role-btn-1')); // human is 2nd player → bot moves first
      act(() => { vi.advanceTimersByTime(1500); }); // bot "thinking" delay → phase1
      act(() => { vi.advanceTimersByTime(750); }); // the chained phase2 — must not be rejected
      return getByTestId('board').textContent;
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  };

  it('validates a bot-chained second move against the returned nextTurnState', () => {
    expect(playTwoPhaseV2BotTurn(750)).toBe('initial,p1,p2');
  });

  it('validates a 0-delay chained second move dispatched before React re-renders', () => {
    expect(playTwoPhaseV2BotTurn(0)).toBe('initial,p1,p2');
  });

  // These two tests pin what the external store fixed: validators and chained
  // dispatches read the authoritative store, not a render snapshot. A validator
  // depending on a mid-turn-changing ctx field OTHER than turnState (here
  // moveCount) was impossible under the old per-field ctxRef shadow.
  describe('the external store fixes render-snapshot staleness', () => {
    it('a 0-delay chained dispatch validates against current ctx.moveCount', () => {
      vi.useFakeTimers();
      try {
        const config = makeConfig({
          BoardClient: ({ board }: BoardClientProps<Board>) => (
            <span data-testid="board">{board.join(',')}</span>
          ),
          gameplay: {
            moves: {
              phase1: { apply: (board: Board) => ({ nextBoard: [...board, 'p1'] }) },
              phase2: {
                validate: (_board: Board, { ctx }: { ctx: Ctx }) => ctx.moveCount === 1,
                apply: (board: Board) => ({ nextBoard: [...board, 'p2'], isTurnEnd: true })
              }
            }
          },
          botStrategy: ({ board, moves }) => {
            const { nextBoard } = moves.phase1(board);
            setTimeout(() => { moves.phase2(nextBoard); }, 0);
          }
        });
        const { getByTestId } = renderGame(config);
        fireEvent.click(getByTestId('role-btn-1')); // bot moves first
        act(() => { vi.advanceTimersByTime(1500); }); // phase1
        act(() => { vi.advanceTimersByTime(0); }); // chained phase2, before any re-render
        expect(getByTestId('board').textContent).toBe('initial,p1,p2');
      } finally {
        vi.clearAllTimers();
        vi.useRealTimers();
      }
    });

    it('throws in dev when a chained dispatch passes a stale board', () => {
      vi.useFakeTimers();
      try {
        const config = makeConfig({
          gameplay: {
            moves: {
              step: { apply: (board: Board) => ({ nextBoard: [...board, 'x'] }) }
            }
          },
          botStrategy: ({ board, moves }) => {
            moves.step(board);
            // BUG under test: passes the original board instead of nextBoard
            setTimeout(() => { moves.step(board); }, 0);
          }
        });
        const { getByTestId } = renderGame(config);
        fireEvent.click(getByTestId('role-btn-1')); // bot moves first
        expect(() => act(() => { vi.advanceTimersByTime(1500); }))
          .toThrow(/stale board passed to move step/);
      } finally {
        vi.clearAllTimers();
        vi.useRealTimers();
      }
    });
  });

  describe('validate on outcome-returning moves', () => {
    const guardedV2Config = (botStrategy: () => void = () => {}) => makeConfig({
      BoardClient: ({ board, moves }: BoardClientProps<Board>) => (
        <>
          <button data-testid="legal-btn" onClick={() => moves.guarded(board, 'ok')}>legal</button>
          <button data-testid="illegal-btn" onClick={() => moves.guarded(board, 'bad')}>illegal</button>
          <button data-testid="hand-over-btn" onClick={() => moves.handOver(board)}>hand over</button>
          <span data-testid="board">{board.join(',')}</span>
        </>
      ),
      gameplay: {
        moves: {
          guarded: {
            validate: (_board: Board, _meta: { ctx: Ctx }, arg: string) => arg === 'ok',
            apply: (board: Board, _meta: { ctx: Ctx }, arg: string) =>
              ({ nextBoard: [...board, arg] })
          },
          handOver: { apply: (board: Board) => ({ nextBoard: board, isTurnEnd: true }) }
        }
      },
      botStrategy
    });

    it('silently ignores an illegal client dispatch', () => {
      const { getByTestId } = renderGame(guardedV2Config());
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('illegal-btn')); // must not throw
      expect(getByTestId('board').textContent).toBe('initial');
      fireEvent.click(getByTestId('legal-btn'));
      expect(getByTestId('board').textContent).toBe('initial,ok');
    });

    it('throws loudly in dev on an illegal bot dispatch', () => {
      vi.useFakeTimers();
      try {
        const botStrategy = vi.fn().mockImplementation((args: any) => {
          args.moves.guarded(args.board, 'bad');
        });
        const { getByTestId } = renderGame(guardedV2Config(botStrategy));
        fireEvent.click(getByTestId('role-btn-0'));
        fireEvent.click(getByTestId('hand-over-btn')); // → bot's turn
        expect(() => act(() => { vi.advanceTimersByTime(1500); })).toThrow(/illegal move/);
        expect(getByTestId('board').textContent).toBe('initial');
      } finally {
        vi.clearAllTimers();
        vi.useRealTimers();
      }
    });
  });
});
