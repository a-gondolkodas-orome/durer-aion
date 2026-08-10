// @vitest-environment jsdom
import { fireEvent, act } from '@testing-library/react';
import type { StrategyGameConfig } from './strategy-game-factory';
import {
  makeConfig, minimalConfig, ctxAwareConfig, renderGame, warmUpPlayerNameSetup,
  MinimalBoardClient, CtxAwareBoardClient, defaultGameplay, type Board
} from './spec-helpers';
import type { BoardClientProps, BotMove, BotStrategy, Ctx, Gameplay, StrategyArgs, VariantInput } from './types';

beforeAll(warmUpPlayerNameSetup);

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
    const botStrategy = vi.fn((): BotMove[] => []);
    const { getByTestId } = renderGame(ctxAwareConfig(botStrategy));
    fireEvent.click(getByTestId('mode-vsHuman'));
    fireEvent.click(getByTestId('start-hh-game-0'));
    fireEvent.click(getByTestId('move-btn')); // endTurn → currentPlayer 1
    act(() => { vi.advanceTimersByTime(1500); });
    expect(botStrategy).not.toHaveBeenCalled();
  });

  // A scheduled bot step must not outlive the game: the player may navigate
  // away mid-turn, and a stray timer would move in a store nobody is rendering.
  it('drops a scheduled bot turn when the game unmounts', () => {
    const botStrategy = vi.fn((): BotMove => ({ move: 'mainMove' }));
    const { getByTestId, unmount } = renderGame(ctxAwareConfig(botStrategy));
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('move-btn')); // endTurn → bot's turn scheduled
    unmount();
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(botStrategy).not.toHaveBeenCalled();
  });

  it('throws in dev when the bot names a move the game does not have', () => {
    const { getByTestId } = renderGame(ctxAwareConfig(() => ({ move: 'mianMove' })));
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('move-btn')); // endTurn → bot's turn
    expect(() => act(() => { vi.advanceTimersByTime(1500); }))
      .toThrow(/named unknown move 'mianMove' \(this game has: mainMove\)/);
  });

  it('calls botStrategy when it becomes the computer turn', () => {
    const botStrategy = vi.fn((): BotMove => ({ move: 'mainMove' }));
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

// The two halves of a variant decide which mode can host it: a variant with no
// `generateStartBoard` has no position to deal two humans, and one with no
// `botStrategy` has nobody to play the other side against a single player.
describe('variant availability by mode', () => {
  const startBoard = (): Board => ['initial'];
  const named = (name: string) => ({ hu: name, en: name });

  // 'Gamma' borrows the default variant's start board, so it can only be played
  // against the bot.
  const mixedVariants = () => makeConfig({
    variants: [
      { label: named('Alpha'), isDefault: true, botStrategy: () => [], generateStartBoard: startBoard },
      { label: named('Beta'), botStrategy: () => [], generateStartBoard: startBoard },
      { label: named('Gamma'), botStrategy: () => [] }
    ]
  });

  // No variant names a botStrategy, so resolveVariants has none to fall back on
  // either and the whole game is two-players-only.
  const botlessVariants = () => makeConfig({
    variants: [
      { label: named('Alpha'), isDefault: true, generateStartBoard: startBoard },
      { label: named('Beta'), generateStartBoard: startBoard }
    ]
  });

  const variantRadio = (view: ReturnType<typeof renderGame>, label: string) =>
    view.getByLabelText(label) as HTMLInputElement;

  it('offers every variant in vsComputer mode', () => {
    const view = renderGame(mixedVariants());
    ['Alpha', 'Beta', 'Gamma'].forEach(label => expect(view.queryByLabelText(label)).toBeTruthy());
  });

  it('hides a variant that generates no start board from vsHuman mode', () => {
    const view = renderGame(mixedVariants());
    fireEvent.click(view.getByTestId('mode-vsHuman'));

    expect(view.queryByLabelText('Gamma')).toBeNull();
    expect(view.queryByLabelText('Alpha')).toBeTruthy();
    expect(view.queryByLabelText('Beta')).toBeTruthy();
  });

  it('disables every variant in vsComputer mode when the game defines no bot', () => {
    const view = renderGame(botlessVariants());

    expect(variantRadio(view, 'Alpha').disabled).toBe(true);
    expect(variantRadio(view, 'Beta').disabled).toBe(true);
  });

  // The variant radio is not the only thing a missing bot turns off: with nobody
  // to play the other side there is no role to choose either.
  it('blocks role selection in vsComputer mode when the game defines no bot', () => {
    const view = renderGame(botlessVariants());

    expect((view.getByTestId('role-btn-0') as HTMLButtonElement).disabled).toBe(true);
    expect((view.getByTestId('role-btn-1') as HTMLButtonElement).disabled).toBe(true);
  });

  it('offers both roles when the selected variant does have a bot', () => {
    const view = renderGame(mixedVariants());

    expect((view.getByTestId('role-btn-0') as HTMLButtonElement).disabled).toBe(false);
    expect((view.getByTestId('role-btn-1') as HTMLButtonElement).disabled).toBe(false);
  });

  it('enables those same variants in vsHuman mode, which needs no bot', () => {
    const view = renderGame(botlessVariants());
    fireEvent.click(view.getByTestId('mode-vsHuman'));

    expect(variantRadio(view, 'Alpha').disabled).toBe(false);
    expect(variantRadio(view, 'Beta').disabled).toBe(false);
  });

  it('falls back to the default variant when switching to vsHuman would leave none selected', () => {
    const view = renderGame(mixedVariants());
    fireEvent.click(variantRadio(view, 'Gamma'));
    expect(variantRadio(view, 'Gamma').checked).toBe(true);

    fireEvent.click(view.getByTestId('mode-vsHuman'));
    expect(variantRadio(view, 'Alpha').checked).toBe(true);
  });

  it('keeps the selected variant when switching to vsHuman can host it', () => {
    const view = renderGame(mixedVariants());
    fireEvent.click(variantRadio(view, 'Beta'));

    fireEvent.click(view.getByTestId('mode-vsHuman'));
    expect(variantRadio(view, 'Beta').checked).toBe(true);
  });
});

describe('variant in the URL', () => {
  const startBoard = (): Board => ['initial'];
  const named = (name: string) => ({ hu: name, en: name });

  // Alpha is the default and carries no id, so it is addressed by its index;
  // Beta names one, the way a variant worth a durable link does.
  const identifiedVariants = () => makeConfig({
    variants: [
      { label: named('Alpha'), isDefault: true, botStrategy: () => [], generateStartBoard: startBoard },
      { id: 'beta', label: named('Beta'), botStrategy: () => [], generateStartBoard: startBoard },
      { label: named('Gamma'), botStrategy: () => [], generateStartBoard: startBoard }
    ]
  });

  const variantRadio = (view: ReturnType<typeof renderGame>, label: string) =>
    view.getByLabelText(label) as HTMLInputElement;
  const search = (view: ReturnType<typeof renderGame>) => view.getByTestId('search').textContent;

  it('starts on the variant the URL names by id', () => {
    const view = renderGame(identifiedVariants(), '/?variant=beta');
    expect(variantRadio(view, 'Beta').checked).toBe(true);
  });

  it('starts on the variant the URL names by index when it declares no id', () => {
    const view = renderGame(identifiedVariants(), '/?variant=2');
    expect(variantRadio(view, 'Gamma').checked).toBe(true);
  });

  it('falls back to the default variant when the URL names an unknown one', () => {
    const view = renderGame(identifiedVariants(), '/?variant=nonsense');
    expect(variantRadio(view, 'Alpha').checked).toBe(true);
  });

  it('writes the chosen variant to the URL', () => {
    const view = renderGame(identifiedVariants());
    fireEvent.click(variantRadio(view, 'Beta'));

    expect(search(view)).toBe('?variant=beta');
  });

  it('drops the param when the default variant is chosen back, as ?lang= does for hu', () => {
    const view = renderGame(identifiedVariants(), '/?variant=beta');
    fireEvent.click(variantRadio(view, 'Alpha'));

    expect(search(view)).toBe('');
  });

  it('leaves other params alone', () => {
    const view = renderGame(identifiedVariants(), '/?lang=en');
    fireEvent.click(variantRadio(view, 'Beta'));

    expect(search(view)).toBe('?lang=en&variant=beta');
  });

  it('writes the param on a variant switch made after another one', () => {
    const view = renderGame(identifiedVariants(), '/?variant=beta');
    fireEvent.click(variantRadio(view, 'Gamma'));

    expect(variantRadio(view, 'Gamma').checked).toBe(true);
    expect(search(view)).toBe('?variant=2');
  });

  // The reason the param is followed rather than read once: a same-route hash
  // navigation remounts nothing, so a link to a variant of the game already
  // open would otherwise change the URL and leave the board alone.
  it('follows the param when it changes without a remount', () => {
    const view = renderGame(identifiedVariants(), '/?variant=beta');
    expect(variantRadio(view, 'Beta').checked).toBe(true);

    fireEvent.click(view.getByTestId('go-to-gamma'));

    expect(variantRadio(view, 'Gamma').checked).toBe(true);
  });

  it('goes back to the default variant when the param is dropped', () => {
    const view = renderGame(identifiedVariants(), '/?variant=beta');

    fireEvent.click(view.getByTestId('go-to-no-variant'));

    expect(variantRadio(view, 'Alpha').checked).toBe(true);
  });

  it('stays put when the param names no variant of this game', () => {
    const view = renderGame(identifiedVariants(), '/?variant=beta');

    fireEvent.click(view.getByTestId('go-to-nonsense'));

    expect(variantRadio(view, 'Beta').checked).toBe(true);
  });
});

describe('strategyGameFactory endOfTurnMove', () => {
  beforeAll(() => { vi.useFakeTimers(); });
  afterAll(() => { vi.useRealTimers(); });
  afterEach(() => { vi.clearAllTimers(); });

  it('calls endOfTurnMove after the step delay when a move returns autoEndOfTurn: true', () => {
    // the beat is spread over 750-1250ms so the bot does not answer like a
    // metronome; pinning Math.random makes it exactly the low end
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const autoMove = vi.fn((board: Board) => ({ nextBoard: board }));
    const moves: Gameplay<Board>['moves'] = {
      mainMove: {
        apply: (board: Board) => ({ nextBoard: board, isTurnEnd: true, autoEndOfTurn: true })
      },
      autoMove: { apply: autoMove }
    };

    const { getByTestId } = renderGame(minimalConfig({ moves, endOfTurnMove: 'autoMove' }));
    // human-vs-human: mainMove passes the turn, and the bot's own pause is the
    // same beat, so this keeps the schedule under test to the endOfTurnMove
    fireEvent.click(getByTestId('mode-vsHuman'));
    fireEvent.click(getByTestId('start-hh-game-0'));
    fireEvent.click(getByTestId('move-btn'));

    expect(autoMove).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(750); });

    expect(autoMove).toHaveBeenCalledOnce();
  });

  it('does not call endOfTurnMove when a move does not return autoEndOfTurn', () => {
    const autoMove = vi.fn((board: Board) => ({ nextBoard: board }));
    const moves: Gameplay<Board>['moves'] = {
      mainMove: {
        apply: (board: Board) => ({ nextBoard: board, isTurnEnd: true })
      },
      autoMove: { apply: autoMove }
    };

    const { getByTestId } = renderGame(minimalConfig({ moves, endOfTurnMove: 'autoMove' }));
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('move-btn'));
    act(() => { vi.advanceTimersByTime(750); });

    expect(autoMove).not.toHaveBeenCalled();
  });

  // A bot move returning autoEndOfTurn leaves the turn unfinished, which is
  // also the condition for calling the bot again — but the scheduled
  // endOfTurnMove already owns the rest of the turn, so the bot must not move.
  it('does not call the bot again while its auto endOfTurnMove is pending', () => {
    const botStrategy = vi.fn((): BotMove => ({ move: 'mainMove' }));
    const moves: Gameplay<Board>['moves'] = {
      mainMove: { apply: (board: Board) => ({ nextBoard: [...board, 'main'], autoEndOfTurn: true }) },
      autoMove: { apply: (board: Board) => ({ nextBoard: [...board, 'auto'], isTurnEnd: true }) }
    };

    const { getByTestId } = renderGame(makeConfig({
      BoardClient: ({ board }: BoardClientProps<Board>) => (
        <span data-testid="board">{board.join(',')}</span>
      ),
      gameplay: { moves, endOfTurnMove: 'autoMove' },
      botStrategy
    }));
    fireEvent.click(getByTestId('role-btn-1')); // human is 2nd player → bot moves first
    act(() => { vi.advanceTimersByTime(1500); }); // thinking delay → mainMove
    act(() => { vi.advanceTimersByTime(10_000); }); // endOfTurnMove, and no bot step

    expect(botStrategy).toHaveBeenCalledOnce();
    expect(getByTestId('board').textContent).toBe('initial,main,auto');
  });
});

const gameEndingConfig = (variants?: VariantInput<Board>[]) => makeConfig({
  variants,
  BoardClient: ({ board, moves }: BoardClientProps<Board>) => (
    <>
      <button data-testid="end-win-btn" onClick={() => moves.endWin(board)}>win</button>
      <button data-testid="end-lose-btn" onClick={() => moves.endLose(board)}>lose</button>
    </>
  ),
  gameplay: {
    moves: {
      endWin: {
        apply: (board: Board, { ctx }: { ctx: Ctx }) => {
          return { nextBoard: board, gameEnd: { winnerIndex: ctx.currentPlayer! } };
        }
      },
      endLose: {
        apply: (board: Board, { ctx }: { ctx: Ctx }) => {
          return { nextBoard: board, gameEnd: { winnerIndex: ctx.currentPlayer === 0 ? 1 : 0 } };
        }
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

  // Keyed by the variant's key, so a game that declares ids keeps its tallies
  // where reordering its variants cannot shuffle them.
  it('keys the tally by the variant id when there is one', () => {
    const variants = [
      { id: 'alpha', isDefault: true, botStrategy: () => [], generateStartBoard: (): Board => [] }
    ];
    const { getByTestId } = renderGame(gameEndingConfig(variants));
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('end-win-btn'));

    expect(JSON.parse(localStorage.getItem('stats__alpha')!)).toEqual({ win: 1, loss: 0 });
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
          botStrategy: () => [],
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

    // the variant radios' group name is a useId, so select them by the
    // fieldset they live in rather than by a fixed name
    const variantFieldset = container.querySelectorAll('fieldset')[1]!;
    const radios = variantFieldset.querySelectorAll('input[type="radio"]');
    fireEvent.click(radios[1]!);

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
          botStrategy: () => [],
          generateStartBoard: (): Board => ['a'],
          isDefault: true
        },
        {
          botStrategy: () => [],
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

  // Reported by the same key the URL uses, so a dashboard row and a shared
  // link name a variant the same way.
  const identifiedVariants: VariantInput<Board>[] = [
    { id: 'alpha', isDefault: true, botStrategy: () => [], generateStartBoard: (): Board => [] },
    { label: { hu: 'Beta', en: 'Beta' }, botStrategy: () => [], generateStartBoard: (): Board => [] }
  ];

  it('reports the variant by its id', () => {
    const { getByTestId } = renderGame(gameEndingConfig(identifiedVariants));
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('end-win-btn'));
    expect(lastEvent()[1]).toMatchObject({ variant: 'alpha' });
  });

  it('reports the index for a variant that declares no id', () => {
    const { getByTestId } = renderGame(gameEndingConfig(identifiedVariants), '/?variant=1');
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('end-win-btn'));
    expect(lastEvent()[1]).toMatchObject({ variant: '1' });
  });
});

describe('move validate enforcement', () => {
  const guardedConfig = (botStrategy: BotStrategy<Board> = () => []) => makeConfig({
    BoardClient: ({ board, moves }: BoardClientProps<Board>) => (
      <>
        <button data-testid="legal-btn" onClick={() => moves.guarded(board, 'ok')}>legal</button>
        <button data-testid="illegal-btn" onClick={() => moves.guarded(board, 'bad')}>illegal</button>
        <button data-testid="hand-over-btn" onClick={() => moves.handOver(board)}>hand over</button>
        <span data-testid="board">{board.join(',')}</span>
        <span data-testid="can-ok">{String(moves.guarded.isAllowed(board, 'ok'))}</span>
        <span data-testid="can-bad">{String(moves.guarded.isAllowed(board, 'bad'))}</span>
      </>
    ),
    gameplay: {
      moves: {
        guarded: {
          apply: (board: Board, _meta, arg: string) => ({ nextBoard: [...board, arg] }),
          validate: (_board: Board, _meta: { ctx: Ctx }, arg: string) => arg === 'ok'
        },
        handOver: {
          apply: (board: Board) => ({ nextBoard: board, isTurnEnd: true })
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
      const botStrategy = vi.fn(() => ({ move: 'guarded', args: ['bad'] }));
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

  // A bot names moves rather than dispatching them, so it is handed no move
  // wrappers at all — and therefore no isAllowed, which would be false all
  // through its own turn anyway.
  it('hands a bot the position only, not the move wrappers', () => {
    vi.useFakeTimers();
    try {
      const seen: StrategyArgs<Board>[] = [];
      const botStrategy: BotStrategy<Board> = (args) => {
        seen.push(args);
        return { move: 'guarded', args: ['ok'] };
      };
      const { getByTestId } = renderGame(guardedConfig(botStrategy));
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('hand-over-btn')); // → bot's turn
      act(() => { vi.advanceTimersByTime(1500); });
      expect(Object.keys(seen[0]!)).toEqual(['board', 'ctx']);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('dispatches a move with no validator unconditionally', () => {
    // defaultGameplay's mainMove defines no validator, so every dispatch applies
    const { getByTestId } = renderGame(ctxAwareConfig());
    fireEvent.click(getByTestId('role-btn-0'));
    fireEvent.click(getByTestId('move-btn'));
    expect((getByTestId('move-btn') as HTMLButtonElement).disabled).toBe(true); // bot's turn now
  });

  // Mirrors the coins-in-3-piles bots: a two-phase turn, one move per bot call,
  // the engine calling the bot again because phase 1 did not end the turn. The
  // phase-2 validator reads ctx.turnState, which phase 1's returned
  // nextTurnState just set — so the second call has to be judged against the
  // authoritative store rather than the render the first call came from.
  const twoPhaseBotConfig = () => makeConfig({
    BoardClient: ({ board }: BoardClientProps<Board>) => (
      <span data-testid="board">{board.join(',')}</span>
    ),
    gameplay: {
      moves: {
        phase1: {
          validate: (_board: Board, { ctx }: { ctx: Ctx }) => ctx.turnState === null,
          apply: (board: Board) => ({
            nextBoard: [...board, 'p1'], nextTurnState: { removedCoinValue: 3 }
          })
        },
        phase2: {
          validate: (_board: Board, { ctx }: { ctx: Ctx }) => ctx.turnState !== null,
          apply: (board: Board) => ({
            nextBoard: [...board, 'p2'], isTurnEnd: true, nextTurnState: null
          })
        }
      }
    },
    botStrategy: ({ ctx }) => ctx.turnState === null ? { move: 'phase1' } : { move: 'phase2' }
  });

  const playTwoPhaseBotTurn = (extraMs = 0) => {
    vi.useFakeTimers();
    try {
      vi.spyOn(Math, 'random').mockReturnValue(0); // pin the spread beat to 750ms
      const { getByTestId } = renderGame(twoPhaseBotConfig());
      fireEvent.click(getByTestId('role-btn-1')); // human is 2nd player → bot moves first
      act(() => { vi.advanceTimersByTime(1500); }); // bot "thinking" delay → phase1
      act(() => { vi.advanceTimersByTime(750 + extraMs) }); // called again → phase2
      return getByTestId('board').textContent;
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  };

  it('calls the bot again for a move that did not end its turn', () => {
    expect(playTwoPhaseBotTurn()).toBe('initial,p1,p2');
  });

  it('stops calling the bot once its move ended the turn', () => {
    expect(playTwoPhaseBotTurn(10_000)).toBe('initial,p1,p2');
  });

  describe('in production (import.meta.env.DEV = false)', () => {
    beforeEach(() => { vi.stubEnv('DEV', false); vi.useFakeTimers(); });
    afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); });

    const illegalBotStrategy = () =>
      vi.fn((): BotMove => ({ move: 'guarded', args: ['bad'] }));

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
    // gameEnd never flips the player: the move names the winner outright, so
    // nothing has to be inferred from whose turn it would have been.
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
        botStrategy: () => ({ move: 'contradiction' })
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

  it('autoEndOfTurn schedules an outcome-returning endOfTurnMove after the step delay', () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(Math, 'random').mockReturnValue(0); // pin the spread beat to 750ms
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

    // The BoardClient's own path to turnState, next to the move-returned one
    // above. It must not count as a move: an undo taken right after it has to
    // find no snapshot to restore.
    it('the setTurnState prop writes turnState without registering a move', () => {
      const { getByTestId } = renderGame(makeConfig({
        BoardClient: ({ ctx, setTurnState }: BoardClientProps<Board>) => (
          <>
            <button data-testid="select-btn" onClick={() => setTurnState({ pile: 2 })}>select</button>
            <button data-testid="deselect-btn" onClick={() => setTurnState(null)}>deselect</button>
            <span data-testid="ts">{JSON.stringify(ctx.turnState)}</span>
            <span data-testid="moves">{ctx.moveCount}</span>
          </>
        )
      }));
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('select-btn'));
      expect(getByTestId('ts').textContent).toBe('{"pile":2}');
      expect(getByTestId('moves').textContent).toBe('0');
      expect((getByTestId('undo-btn') as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(getByTestId('deselect-btn'));
      expect(getByTestId('ts').textContent).toBe('null');
    });
  });

  // These two tests pin what the external store fixed: validators and chained
  // dispatches read the authoritative store, not a render snapshot. A validator
  // depending on a mid-turn-changing ctx field OTHER than turnState (here
  // moveCount) was impossible under the old per-field ctxRef shadow.
  describe('the external store fixes render-snapshot staleness', () => {
    it('validates the second move of a bot turn against current ctx.moveCount', () => {
      vi.useFakeTimers();
      try {
        vi.spyOn(Math, 'random').mockReturnValue(0); // pin the spread beat to 750ms
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
          botStrategy: () => [{ move: 'phase1' }, { move: 'phase2' }]
        });
        const { getByTestId } = renderGame(config);
        fireEvent.click(getByTestId('role-btn-1')); // bot moves first
        act(() => { vi.advanceTimersByTime(1500); }); // phase1
        act(() => { vi.advanceTimersByTime(750); }); // phase2, before any re-render
        expect(getByTestId('board').textContent).toBe('initial,p1,p2');
      } finally {
        vi.clearAllTimers();
        vi.useRealTimers();
      }
    });

    // Only a BoardClient threads boards into moves — a bot names moves and the
    // engine supplies the board — so this is where a stale board can still come
    // from, and it stays a loud dev error.
    it('throws in dev when a BoardClient chains a move onto a stale board', () => {
      let thrown: Error | null = null;
      const config = makeConfig({
        gameplay: {
          moves: {
            step: { apply: (board: Board) => ({ nextBoard: [...board, 'x'] }) }
          }
        },
        BoardClient: ({ board, moves }: BoardClientProps<Board>) => (
          <button
            data-testid="chain-btn"
            onClick={() => {
              try {
                moves.step(board);
                moves.step(board); // BUG under test: the original board, not nextBoard
              } catch (error) {
                thrown = error as Error;
              }
            }}
          >chain</button>
        )
      });
      const { getByTestId } = renderGame(config);
      fireEvent.click(getByTestId('role-btn-0'));
      fireEvent.click(getByTestId('chain-btn'));
      expect(thrown!.message).toMatch(/stale board passed to move step/);
    });
  });

  describe('validate on outcome-returning moves', () => {
    const guardedV2Config = (botStrategy: BotStrategy<Board> = () => []) => makeConfig({
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
        const botStrategy = vi.fn((): BotMove => ({ move: 'guarded', args: ['bad'] }));
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
