import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { GameHeader } from './game-parts/game-header';
import { GameFooter } from './game-parts/game-footer';
import { GameRule } from './game-parts/game-rule';
import { GameSidebar } from './game-parts/game-sidebar/game-sidebar';
import { GameEndDialog } from './game-parts/game-end-dialog';
import { mapValues, isEqual } from 'lodash';
import { useTranslation, type TranslatableNode, type I18nString } from 'language';
import { useLocation, useSearchParams } from 'react-router';
import { useGameStats } from './hooks/use-game-stats';
import { trackEvent } from '../../tracking';
import type {
  Mode, Ctx, MoveOutcome, Gameplay, GameMoves, ClientGameMoves, BotStrategy, BotMove,
  BoardClientProps, StrategyArgs, Variant as DisplayVariant, VariantInput
} from './types';
import { resolveVariants, variantKey } from './helpers/resolve-variants';
import { createGameStore, createInitialCoreState } from './engine/store';
import { buildCtx } from './engine/build-ctx';
import { asBotMoves, isBotTurnUnfinished, unknownMoveMessage } from './engine/bot-turn';
import { reduceMove } from './engine/reducer';
import { stepDelay } from './engine/timing';
import { resolvePlayerNames } from './game-parts/common/player-names';

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

// The game component carries the headless half of its own configuration — what
// `runMatch` needs to play it with no browser, so the catalog-wide conformance
// spec reaches every registered game without a second registry to keep in step.
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
  const variantKeys = resolvedVariants.map((variant, index) => variantKey(variant, index));

  const Game = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    // The variant the URL asks for, or the default, which the param's absence
    // means. `-1` is a param naming no variant of this game.
    const requestedVariantIndex = (params: URLSearchParams) => {
      const requested = params.get('variant');
      return requested === null ? defaultVariantIndex : variantKeys.indexOf(requested);
    };
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(() => {
      const index = requestedVariantIndex(searchParams);
      return index === -1 ? defaultVariantIndex : index;
    });
    const activeVariant = resolvedVariants[selectedVariantIndex] ?? defaultVariant;
    const defaultGenerateStartBoard = defaultVariant.generateStartBoard!;
    const activeGenerateStartBoard = activeVariant.generateStartBoard ?? defaultGenerateStartBoard;

    // Authoritative game state lives in a synchronous store outside React
    // (engine/store.ts); React renders a snapshot of it.
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
    const { stats, recordResult, resetStats } = useGameStats(gameId, variantKeys[selectedVariantIndex]);

    useEffect(() => {
      if (!isHumanVsHumanGame && phase === 'play' && currentPlayer === (1 - chosenRoleIndex!)) {
        doBotTurn();
      }
      // doBotTurn is recreated every render, so listing it would restart the
      // bot on every render rather than on a turn change.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPlayer, isHumanVsHumanGame, phase, chosenRoleIndex]);

    const resolvedPlayerNames = resolvePlayerNames(playerNames, t);

    let wrappedGameMoves: GameMoves<TBoard, TTurnState> = {} as GameMoves<TBoard, TTurnState>;

    // Reaching here means a bug or tampering, so dev throws. Prod fails safe
    // instead: a stray call must not corrupt the board or white-screen a player.
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
        // The same key the URL uses, so a variant reads the same in a dashboard
        // as in a link.
        variant: variantKeys[selectedVariantIndex],
        ...(s.mode === 'vsHuman' ? {} : { result: resolvedWinner === s.chosenRoleIndex ? 'win' : 'loss' })
      });
    };

    const dispatchMove = (
      name: string, moveBoard: TBoard, args: unknown[]
    ): MoveOutcome<TBoard, TTurnState> => {
      // A mismatch means a chaining bug — a stale board passed to the second
      // move of a turn — so fail loudly in dev; in prod the store board wins.
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
      // The default variant is the absence of the param, the way `hu` is for
      // `?lang=`, so a shared link carries a variant only when it says something.
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (finalVariantIndex === defaultVariantIndex) next.delete('variant');
        else next.set('variant', variantKeys[finalVariantIndex]);
        return next;
      }, { replace: true });
      store.setState(createInitialCoreState(boardGenerator(), newMode));
      setIsGameEndDialogOpen(false);
      setGameUuid(crypto.randomUUID());
    };

    const setDifficulty = (index: number) => {
      resetGameState({ newVariantIndex: index });
    };

    // Follows a `?variant=` link to the game already open, which a same-route
    // hash navigation would otherwise leave on the old board (see
    // src/components/CLAUDE.md § Variants).
    //
    // Guarded on the index because `resetGameState` writes the param itself, so
    // an unguarded effect would re-enter. Not derivable during render either: it
    // has to *restart the game*, which is an event, not a projection of the URL.
    // `searchParams` alone in the deps for the same reason — re-running when the
    // selection changes would fight the write path.
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
      const index = requestedVariantIndex(searchParams);
      if (index !== -1 && index !== selectedVariantIndex) {
        resetGameState({ newVariantIndex: index });
      }
    }, [searchParams]);
    /* eslint-enable react-hooks/exhaustive-deps */

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

    // What the BoardClient receives: the same moves, but a dispatch that fails
    // `isAllowed` is silently ignored, judged against the current store state.
    // Bots and the auto `endOfTurnMove` use `wrappedGameMoves` instead, where an
    // illegal move fails loudly. See src/components/CLAUDE.md § validate.
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
    // makes the bot look like it is thinking; keeping it out of the strategy is
    // what lets the same strategy run headless (engine/run-match.ts).
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
