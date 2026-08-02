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
  Mode, Ctx, Events, MoveOutcome, EngineMove, Gameplay, GameMoves,
  BoardClientProps, Variant as DisplayVariant, VariantInput
} from './types';
import { resolveVariants } from './helpers/resolve-variants';
import { createGameStore, createInitialCoreState } from './engine/store';
import { buildCtx } from './engine/build-ctx';
import { reduceMove } from './engine/reducer';

const DEFAULT_PLAYER_NAMES: I18nString[] = [
  { hu: '1. játékos', en: '1st player' },
  { hu: '2. játékos', en: '2nd player' }
];

export interface Presentation<TBoard> {
  rule: TranslatableNode
  roleLabels?: [I18nString, I18nString]
  getPlayerStepDescription: (args: { board: TBoard; ctx: Ctx }) => TranslatableNode
}

export type StrategyGameConfig<TBoard> = {
  presentation: Presentation<TBoard>
  BoardClient: React.ComponentType<BoardClientProps<TBoard>>
  gameplay: Gameplay<TBoard>
  variants: VariantInput<TBoard>[]
}

export const strategyGameFactory = <TBoard,>({
  presentation,
  BoardClient,
  gameplay,
  variants
}: StrategyGameConfig<TBoard>) => {
  const { rule, roleLabels, getPlayerStepDescription } = presentation;
  const { moves, endOfTurnMove } = gameplay;
  const { defaultVariantIndex, defaultVariant, resolvedVariants } = resolveVariants(variants);
  const moveDefinitions: Record<string, EngineMove<TBoard>> = moves;
  Object.entries(moveDefinitions).forEach(([name, def]) => {
    if (!!def.legacyApply === !!def.apply) {
      const message = `strategyGameFactory: move ${name} must define exactly one of apply/legacyApply`;
      if (import.meta.env.DEV) {
        throw new Error(message);
      }
      console.warn(message);
    }
  });

  return () => {
    const { t } = useTranslation();
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(defaultVariantIndex);
    const activeVariant = resolvedVariants[selectedVariantIndex] ?? defaultVariant;
    const defaultGenerateStartBoard = defaultVariant.generateStartBoard!;
    const activeGenerateStartBoard = activeVariant.generateStartBoard ?? defaultGenerateStartBoard;

    // Authoritative game state lives in a synchronous store outside React (see
    // engine/store.ts); React renders a snapshot of it. Bots and chained
    // dispatches always read the store, so they can never see stale state.
    const [store] = useState(() => createGameStore(createInitialCoreState(activeGenerateStartBoard())));
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

    const isHumanVsHumanGame = mode === 'vsHuman';

    const gameId = useLocation().pathname.split('/').pop()!;
    const { stats, recordResult, resetStats } = useGameStats(gameId, selectedVariantIndex);

    useEffect(() => {
      if (!isHumanVsHumanGame && phase === 'play' && currentPlayer === (1 - chosenRoleIndex!)) {
        doBotTurn();
      }
    }, [currentPlayer, isHumanVsHumanGame, phase, chosenRoleIndex]); // doBotTurn excluded: recreates every render

    const resolvedPlayerNames: [string, string] = [
      playerNames[0] || t(DEFAULT_PLAYER_NAMES[0]),
      playerNames[1] || t(DEFAULT_PLAYER_NAMES[1])
    ];

    let wrappedGameMoves: GameMoves<TBoard> = {} as GameMoves<TBoard>;

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
    const handleGameEnd = (resolvedWinner: number | null) => {
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

    const dispatchMove = (name: string, moveBoard: TBoard, args: unknown[]): MoveOutcome<TBoard> => {
      // The store board is authoritative; the board argument remains for API
      // compatibility. A mismatch means a chaining bug — a bot or BoardClient
      // passed a stale board to the second move of a turn — so fail loudly in
      // dev; in prod the store board silently wins.
      if (import.meta.env.DEV && !isEqual(moveBoard, store.getState().board)) {
        throw new Error(`strategyGameFactory: stale board passed to move ${name} — `
          + 'pass the latest nextBoard when chaining moves within a turn');
      }
      const transition = reduceMove(
        store.getState(), moveDefinitions[name]!, name, args, resolvedPlayerNames
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
        }, 750);
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
        .map((v, i) => ({ ...v, originalIndex: i, disabled: !humanVsHuman && !v.botStrategy }))
        .filter(v => !humanVsHuman || !!v.generateStartBoard);
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

    const ctx: Ctx = buildCtx(state, resolvedPlayerNames);

    // For the BoardClient (setTurnState is current usage; endTurn/endGame only
    // remain for legacy compatibility). Moves never see this object: legacy
    // `apply` moves get the reducer's events, outcome-returning moves get none.
    const events: Events = {
      endTurn: () => {
        store.setState({
          currentTurnHasMoves: false,
          currentPlayer: 1 - store.getState().currentPlayer!
        });
      },
      endGame: (winnerIndex?: number | null) => {
        const resolvedWinner = winnerIndex ?? store.getState().currentPlayer;
        store.setState({ phase: 'gameEnd', winnerIndex: resolvedWinner });
        handleGameEnd(resolvedWinner);
      },
      setTurnState: (turnState) => {
        store.setState({ turnState });
      }
    };

    wrappedGameMoves = mapValues(moveDefinitions, (_def, name) => {
      const wrapped: GameMoves<TBoard>[string] = (moveBoard: TBoard, ...args: unknown[]) =>
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
    const clientGameMoves: GameMoves<TBoard> = mapValues(moveDefinitions, ({ validate }, name) => {
      const isAllowed = (moveBoard: TBoard, ...args: unknown[]) => {
        const liveCtx = buildCtx(store.getState(), resolvedPlayerNames);
        return liveCtx.isClientMoveAllowed
          && (!validate || validate(moveBoard, { ctx: liveCtx }, ...args));
      };
      const clientWrapped: GameMoves<TBoard>[string] = (moveBoard: TBoard, ...args: unknown[]) =>
        isAllowed(moveBoard, ...args)
          ? wrappedGameMoves[name]!(moveBoard, ...args)
          : { nextBoard: moveBoard };
      clientWrapped.isAllowed = isAllowed;
      return clientWrapped;
    });

    const doBotTurn = () => {
      const { botStrategy } = activeVariant;
      if (!botStrategy) throw new Error('strategyGameFactory: no botStrategy available for vsComputer mode');
      const time = Math.floor(Math.random() * 500 + 1000);
      botTimeoutRef.current = setTimeout(() => {
        botTimeoutRef.current = null;
        // read fresh state: the render this closure came from may be long gone
        const s = store.getState();
        botStrategy({ board: s.board, ctx: buildCtx(s, resolvedPlayerNames), moves: wrappedGameMoves });
      }, time);
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
              events={events}
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
};

// No-op `events` for production code paths that call a move purely to compute
// `nextBoard` (e.g. bot lookahead) and don't care about side effects. For tests
// that need to assert handlers were called, use `makeEvents` from `test-utils`
// (spies) instead — it can't be used here as it depends on vitest.
export const dummyEvents: Events = {
  endTurn: () => {},
  endGame: () => {},
  setTurnState: () => {}
};
