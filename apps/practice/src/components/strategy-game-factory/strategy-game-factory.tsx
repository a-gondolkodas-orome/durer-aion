import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { GameHeader } from './game-parts/game-header';
import { GameFooter } from './game-parts/game-footer';
import { GameRule } from './game-parts/game-rule';
import { GameSidebar } from './game-parts/game-sidebar/game-sidebar';
import { GameEndDialog } from './game-parts/game-end-dialog';
import { mapValues, isEqual } from 'lodash';
import { useTranslation, type TranslatableNode, type I18nString } from '../../language';
import { useLocation } from 'react-router';
import { useGameStats } from './hooks/use-game-stats';
import { trackEvent } from '../../tracking';
import type {
  Mode, Ctx, MoveOutcome, Gameplay, GameMoves, ClientGameMoves, BotStrategy, BotMove,
  BoardClientProps, StrategyArgs, Variant as DisplayVariant, VariantInput
} from './types';
import { resolveVariants } from './helpers/resolve-variants';
import { createGameStore, createInitialCoreState } from './engine/store';
import { buildCtx } from './engine/build-ctx';
import { asBotMoves, isBotTurnUnfinished, unknownMoveMessage } from './engine/bot-turn';
import { reduceMove } from './engine/reducer';
import { stepDelay } from './engine/timing';

const DEFAULT_PLAYER_NAMES: I18nString[] = [
  { hu: '1. játékos', en: '1st player' },
  { hu: '2. játékos', en: '2nd player' }
];

export interface Presentation<TBoard, TTurnState = unknown> {
  rule: TranslatableNode
  roleLabels?: [I18nString, I18nString]
  getPlayerStepDescription: (args: StrategyArgs<TBoard, TTurnState>) => TranslatableNode
}

export type StrategyGameConfig<TBoard, TTurnState = unknown> = {
  presentation: Presentation<TBoard, TTurnState>
  BoardClient: React.ComponentType<BoardClientProps<TBoard, TTurnState>>
  gameplay: Gameplay<TBoard, TTurnState>
  variants: VariantInput<TBoard>[]
}

// The game component carries the headless half of its own configuration. It is
// what `runMatch` needs to play the game with no browser, so the catalog-wide
// conformance spec can reach every registered game without a second registry to
// keep in step — and it is the shape a competition server would load a game by
// (issue #313).
export type StrategyGame<TBoard, TTurnState = unknown> = React.FC & {
  gameplay: Gameplay<TBoard, TTurnState>
  variants: VariantInput<TBoard>[]
}

export const strategyGameFactory = <TBoard, TTurnState = unknown>({
  presentation,
  BoardClient,
  gameplay,
  variants
}: StrategyGameConfig<TBoard, TTurnState>): StrategyGame<TBoard, TTurnState> => {
  const { rule, roleLabels, getPlayerStepDescription } = presentation;
  const { moves, endOfTurnMove } = gameplay;
  const { defaultVariantIndex, defaultVariant, resolvedVariants } = resolveVariants(variants);

  const Game = () => {
    const { t } = useTranslation();
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(defaultVariantIndex);
    const activeVariant = resolvedVariants[selectedVariantIndex] ?? defaultVariant;
    const defaultGenerateStartBoard = defaultVariant.generateStartBoard!;
    const activeGenerateStartBoard = activeVariant.generateStartBoard ?? defaultGenerateStartBoard;

    // Authoritative game state lives in a synchronous store outside React (see
    // engine/store.ts); React renders a snapshot of it. Bots and chained
    // dispatches always read the store, so they can never see stale state.
    const [store] = useState(
      () => createGameStore(createInitialCoreState<TBoard, TTurnState>(activeGenerateStartBoard()))
    );
    const state = useSyncExternalStore(store.subscribe, store.getState);
    const { board, phase, mode, currentPlayer, chosenRoleIndex, undoSnapshot } = state;

    const [isGameEndDialogOpen, setIsGameEndDialogOpen] = useState(false);
    const [gameUuid, setGameUuid] = useState(crypto.randomUUID());
    const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [playerNames, setPlayerNames] = useState<[string, string]>(() => {
      try {
        const stored = localStorage.getItem('durer-player-names');
        if (stored) return JSON.parse(stored) as [string, string];
      } catch {}
      return ['', ''];
    });

    useEffect(() => {
      localStorage.setItem('durer-player-names', JSON.stringify(playerNames));
    }, [playerNames]);

    // A bot step (or auto endOfTurnMove) scheduled when the player navigates
    // away would otherwise still fire, moving in a game nobody is watching.
    useEffect(() => () => {
      if (botTimeoutRef.current !== null) clearTimeout(botTimeoutRef.current);
    }, []);

    const isHumanVsHumanGame = mode === 'vsHuman';

    const gameId = useLocation().pathname.split('/').pop()!;
    const { stats, recordResult, resetStats } = useGameStats(gameId, selectedVariantIndex);

    useEffect(() => {
      if (!isHumanVsHumanGame && phase === 'play' && currentPlayer === (1 - chosenRoleIndex!)) {
        doBotTurn();
      }
      // doBotTurn is recreated every render, so listing it would restart the
      // bot on every render rather than on a turn change.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPlayer, isHumanVsHumanGame, phase, chosenRoleIndex]);

    const resolvedPlayerNames: [string, string] = [
      playerNames[0] || t(DEFAULT_PLAYER_NAMES[0]),
      playerNames[1] || t(DEFAULT_PLAYER_NAMES[1])
    ];

    let wrappedGameMoves: GameMoves<TBoard, TTurnState> = {} as GameMoves<TBoard, TTurnState>;

    // An illegal move should never happen through the UI (buttons are disabled)
    // or a correct bot, so reaching here means a bug or tampering. In dev we
    // throw loudly to surface the bug; in prod we fail safe: warn, record it,
    // and no-op so a stray call can't corrupt the board or white-screen a player.
    const reportIllegalMove = (name: string, moveBoard: TBoard, args: unknown[]) => {
      const message = `strategyGameFactory: illegal move ${name}(${JSON.stringify(args)}) `
        + `rejected on board ${JSON.stringify(moveBoard)}`;
      if (import.meta.env.DEV) {
        throw new Error(message);
      }
      console.warn(message);
      trackEvent('illegal-move', { game: gameId, move: name });
    };

    // Game-end side effects (the state transition itself already happened in
    // the reducer / store): dialog, win/loss stats, analytics.
    const handleGameEnd = (resolvedWinner: number) => {
      const s = store.getState();
      setIsGameEndDialogOpen(true);
      if (s.mode !== 'vsHuman') {
        recordResult(resolvedWinner === s.chosenRoleIndex ? 'win' : 'loss');
      }
      trackEvent('game-finished', {
        game: gameId,
        mode: s.mode,
        variant: selectedVariantIndex,
        ...(s.mode === 'vsHuman' ? {} : { result: resolvedWinner === s.chosenRoleIndex ? 'win' : 'loss' })
      });
    };

    const dispatchMove = (
      name: string, moveBoard: TBoard, args: unknown[]
    ): MoveOutcome<TBoard, TTurnState> => {
      // The store board is authoritative; the board argument remains for API
      // compatibility. A mismatch means a chaining bug — a bot or BoardClient
      // passed a stale board to the second move of a turn — so fail loudly in
      // dev; in prod the store board silently wins.
      if (import.meta.env.DEV && !isEqual(moveBoard, store.getState().board)) {
        throw new Error(`strategyGameFactory: stale board passed to move ${name} — `
          + 'pass the latest nextBoard when chaining moves within a turn');
      }
      const transition = reduceMove(
        store.getState(), moves[name]!, name, args, resolvedPlayerNames
      );
      if (transition.illegal) {
        reportIllegalMove(name, moveBoard, args);
        return transition.result;
      }
      store.setState(transition.state);
      if (transition.gameJustEnded) {
        handleGameEnd(transition.gameJustEnded.winnerIndex);
      }
      if (endOfTurnMove && transition.autoEndOfTurn) {
        botTimeoutRef.current = setTimeout(() => {
          botTimeoutRef.current = null;
          wrappedGameMoves[endOfTurnMove]!(transition.result.nextBoard);
        }, stepDelay());
      }
      return transition.result;
    };

    const resetGameState = ({ newMode = mode, newVariantIndex = selectedVariantIndex } = {}) => {
      const newVariant = resolvedVariants[newVariantIndex] ?? defaultVariant;
      let boardGenerator = newVariant.generateStartBoard ?? defaultGenerateStartBoard;
      let finalVariantIndex = newVariantIndex;
      if (newMode === 'vsHuman' && !newVariant.generateStartBoard) {
        finalVariantIndex = defaultVariantIndex;
        boardGenerator = defaultGenerateStartBoard;
      }
      setSelectedVariantIndex(finalVariantIndex);
      store.setState(createInitialCoreState(boardGenerator(), newMode));
      setIsGameEndDialogOpen(false);
      setGameUuid(crypto.randomUUID());
    };

    const setDifficulty = (index: number) => {
      resetGameState({ newVariantIndex: index });
    };

    const getVariantsForMode = (m: Mode): DisplayVariant[] => {
      const humanVsHuman = m === 'vsHuman';
      return resolvedVariants
        .map((variant, originalIndex) => ({ variant, originalIndex }))
        .filter(({ variant }) => !humanVsHuman || !!variant.generateStartBoard)
        .map(({ variant, originalIndex }) => ({
          originalIndex,
          label: variant.label,
          notAlwaysOptimal: variant.notAlwaysOptimal,
          hasBotStrategy: !!variant.botStrategy,
          disabled: !humanVsHuman && !variant.botStrategy
        }));
    };

    const canUndo = phase === 'play'
      && undoSnapshot !== null
      && (isHumanVsHumanGame || undoSnapshot.currentPlayer === chosenRoleIndex);

    const undo = () => {
      if (!canUndo) return;
      if (botTimeoutRef.current !== null) {
        clearTimeout(botTimeoutRef.current);
        botTimeoutRef.current = null;
      }
      store.setState({
        board: undoSnapshot!.board,
        currentPlayer: undoSnapshot!.currentPlayer,
        moveCount: undoSnapshot!.moveCount,
        turnState: null,
        undoSnapshot: null,
        currentTurnHasMoves: false
      });
    };

    const startGame = (roleIndex: number | null = null) => {
      store.setState({ phase: 'play', currentPlayer: 0, chosenRoleIndex: roleIndex });
    };

    const ctx: Ctx<TTurnState> = buildCtx(state, resolvedPlayerNames);

    // For the BoardClient's mid-turn UI state. Moves never get this; they
    // return `nextTurnState` instead.
    const setTurnState = (turnState: TTurnState | null) => {
      store.setState({ turnState });
    };

    wrappedGameMoves = mapValues(moves, (_def, name) => {
      const wrapped: GameMoves<TBoard, TTurnState>[string] = (moveBoard: TBoard, ...args: unknown[]) =>
        dispatchMove(name, moveBoard, args);
      return wrapped;
    });

    // What the BoardClient receives: the same moves, but a dispatch is silently
    // ignored unless `isAllowed` holds — turn ownership (ctx.isClientMoveAllowed)
    // AND the move's validator, both judged against the current store state.
    // This engine-side gate replaces per-handler `if (!allowed) return` guards,
    // and also covers browsers that fire pointer events on disabled buttons.
    // Bots and the auto `endOfTurnMove` dispatch use `wrappedGameMoves` instead:
    // there an illegal move is a bug, and the validator fails loudly (see
    // `reportIllegalMove`).
    const clientGameMoves: ClientGameMoves<TBoard, TTurnState> = mapValues(moves, ({ validate }, name) => {
      const isAllowed = (moveBoard: TBoard, ...args: unknown[]) => {
        const liveCtx = buildCtx(store.getState(), resolvedPlayerNames);
        return liveCtx.isClientMoveAllowed
          && (!validate || validate(moveBoard, { ctx: liveCtx }, ...args));
      };
      const clientWrapped: ClientGameMoves<TBoard, TTurnState>[string] = Object.assign(
        (moveBoard: TBoard, ...args: unknown[]) =>
          isAllowed(moveBoard, ...args)
            ? wrappedGameMoves[name]!(moveBoard, ...args)
            : { nextBoard: moveBoard },
        { isAllowed }
      );
      return clientWrapped;
    });

    // Asks the bot what it wants to play. Reads the store rather than the
    // render this closure came from, which may be long gone by now.
    const askBot = (botStrategy: BotStrategy<TBoard>): BotMove[] => {
      const state = store.getState();
      const named = asBotMoves(botStrategy({
        board: state.board, ctx: buildCtx(state, resolvedPlayerNames)
      }));
      // Naming nothing leaves the turn with the bot forever, so it is a bug in
      // the strategy — loud in dev, and in prod a stalled bot beats a crash.
      if (!named.length) {
        const message = 'strategyGameFactory: botStrategy named no move to play';
        if (import.meta.env.DEV) throw new Error(message);
        console.warn(message);
      }
      return named;
    };

    // Plays the bot's named moves one at a time. The pause before each is what
    // makes the bot look like it is thinking; keeping it here rather than
    // inside the strategy is what lets the same strategy run headless
    // (engine/run-match.ts).
    const runBotTurn = (queue: BotMove[], delay: number, botStrategy: BotStrategy<TBoard>) => {
      botTimeoutRef.current = setTimeout(() => {
        botTimeoutRef.current = null;
        const playerBefore = store.getState().currentPlayer!;
        const named = queue.length ? queue : askBot(botStrategy);
        if (!named.length) return;
        const [{ move, args = [] }, ...rest] = named;
        if (!moves[move]) {
          if (import.meta.env.DEV) throw new Error(unknownMoveMessage(move, moves));
          console.warn(unknownMoveMessage(move, moves));
          return;
        }
        // The board comes from the store, so a bot has no board to pass and
        // therefore no way to pass a stale one.
        wrappedGameMoves[move]!(store.getState().board, ...args);
        if (!isBotTurnUnfinished(store.getState(), playerBefore)) {
          // A turn planned as a whole may win partway through — the rest of the
          // plan is then moot rather than wrong.
          if (import.meta.env.DEV && rest.length && store.getState().phase !== 'gameEnd') {
            throw new Error(`strategyGameFactory: botStrategy named moves after ${move} ended its turn`);
          }
          return;
        }
        // A pending auto endOfTurnMove occupies the same timeout slot and
        // already owns the rest of the turn, so only carry on without one.
        if (botTimeoutRef.current === null) {
          runBotTurn(rest, stepDelay(), botStrategy);
        }
      }, delay);
    };

    const doBotTurn = () => {
      const { botStrategy } = activeVariant;
      if (!botStrategy) {
        throw new Error('strategyGameFactory: no botStrategy available for vsComputer mode');
      }
      runBotTurn([], stepDelay(), botStrategy);
    };

    const visibleVariants = getVariantsForMode(mode);

    return (
    <main className="flex flex-col p-2 min-h-screen">
      <GameHeader />
      <div className="flex justify-center grow">
        <div className="max-w-[100ch] w-full">
          <GameRule ruleDescription={t(activeVariant.rule ?? rule)} />
          <div className="flex flex-wrap">
            <BoardClient
              key={gameUuid}
              board={board}
              ctx={ctx}
              setTurnState={setTurnState}
              moves={clientGameMoves}
            />
            <GameSidebar
              roleLabels={roleLabels}
              stepDescription={t(getPlayerStepDescription({ board, ctx }))}
              ctx={ctx}
              playerNames={playerNames}
              moves={{
                startGame,
                resetGameState,
                switchMode: (newMode) => resetGameState({ newMode }),
                setPlayerNames,
                setDifficulty,
                undo,
                canUndo
              }}
              variants={visibleVariants}
              selectedVariantIndex={selectedVariantIndex}
              stats={stats}
              onResetStats={resetStats}
            />
          </div>
        </div>
      </div>
      <GameFooter />
      <GameEndDialog
        isOpen={isGameEndDialogOpen}
        setIsOpen={setIsGameEndDialogOpen}
        ctx={ctx}
        selectedVariantIndex={selectedVariantIndex}
        getVariantsForMode={getVariantsForMode}
        onNewGame={(newMode, variantIndex) => resetGameState({ newMode, newVariantIndex: variantIndex })}
      />
    </main>
    );
  };

  Game.gameplay = gameplay;
  Game.variants = resolvedVariants;
  return Game;
};
