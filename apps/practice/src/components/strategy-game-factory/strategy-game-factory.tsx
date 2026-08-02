import React, { useState, useEffect, useRef } from 'react';
import { GameHeader } from './game-parts/game-header';
import { GameFooter } from './game-parts/game-footer';
import { GameRule } from './game-parts/game-rule';
import { GameSidebar } from './game-parts/game-sidebar/game-sidebar';
import { GameEndDialog } from './game-parts/game-end-dialog';
import { mapValues, cloneDeep } from 'lodash';
import { useTranslation, type TranslatableNode, type I18nString } from '../../language';
import { useLocation } from 'react-router';
import { useGameStats } from './hooks/use-game-stats';
import { trackEvent } from '../../tracking';
import type {
  Phase, Mode, Ctx, Events, MoveOutcome, NormalizedMove, Gameplay, GameMoves,
  BoardClientProps, Variant as DisplayVariant, VariantInput
} from './types';
import { resolveVariants } from './helpers/resolve-variants';

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
  // Normalize the shorthand (plain function = legacy move with no validator)
  // so the rest of the engine deals with a single long-form shape.
  const normalizedMoves: Record<string, NormalizedMove<TBoard>> =
    mapValues(moves, (m) => typeof m === 'function' ? { legacyApply: m } : m);
  Object.entries(normalizedMoves).forEach(([name, def]) => {
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

    const [board, setBoard] = useState<TBoard>(activeGenerateStartBoard());
    const [phase, setPhase] = useState<Phase>('roleSelection');
    const [chosenRoleIndex, setChosenRoleIndex] = useState<number | null>(null);
    const [currentPlayer, setCurrentPlayer] = useState<number | null>(null);
    const [isGameEndDialogOpen, setIsGameEndDialogOpen] = useState(false);
    const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
    const [gameUuid, setGameUuid] = useState(crypto.randomUUID());
    const [moveCount, setMoveCount] = useState(0);
    const [turnState, setTurnState] = useState<unknown>(null);
    const [mode, setMode] = useState<Mode>('vsComputer');
    type UndoSnapshot = { board: TBoard; currentPlayer: number; moveCount: number };
    const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);
    const currentTurnHasMovesRef = useRef(false);
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

    const moveWrapper = (
      name: string,
      moveBoard: TBoard,
      args: unknown[],
      doMove: () => MoveOutcome<TBoard>
    ): MoveOutcome<TBoard> => {
      const { validate, apply } = normalizedMoves[name]!;
      if (validate && !validate(moveBoard, { ctx: ctxRef.current }, ...args)) {
        reportIllegalMove(name, moveBoard, args);
        return { nextBoard: moveBoard };
      }
      if (!currentTurnHasMovesRef.current) {
        setUndoSnapshot({ board: cloneDeep(board), currentPlayer: currentPlayer!, moveCount });
        currentTurnHasMovesRef.current = true;
      }
      const moveResult = doMove();
      setBoard(moveResult.nextBoard);
      setMoveCount(c => c + 1);
      // The returned outcome is interpreted only for outcome-returning `apply`
      // moves: a legacy move causes turn/game transitions through `events`
      // instead, and any extra fields it happens to return must stay inert.
      if (apply) {
        // Through `events.setTurnState` so ctxRef is patched synchronously — a
        // chained dispatch can validate before React re-renders.
        if (moveResult.nextTurnState !== undefined) {
          events.setTurnState(moveResult.nextTurnState);
        }
        if (moveResult.gameEnd) {
          if (import.meta.env.DEV && (moveResult.isTurnEnd || moveResult.autoEndOfTurn)) {
            throw new Error(`strategyGameFactory: move ${name} returned gameEnd `
              + 'together with isTurnEnd/autoEndOfTurn');
          }
          endGame(moveResult.gameEnd.winnerIndex);
          return moveResult;
        }
        if (moveResult.isTurnEnd) {
          endTurn();
        }
      }
      if (endOfTurnMove && moveResult.autoEndOfTurn) {
        botTimeoutRef.current = setTimeout(() => {
          botTimeoutRef.current = null;
          wrappedGameMoves[endOfTurnMove]!(moveResult.nextBoard);
        }, 750);
      }
      return moveResult;
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
      setMode(newMode);
      setBoard(boardGenerator());
      setPhase('roleSelection');
      setChosenRoleIndex(null);
      setCurrentPlayer(null);
      setIsGameEndDialogOpen(false);
      setWinnerIndex(null);
      setGameUuid(crypto.randomUUID());
      setMoveCount(0);
      setTurnState(null);
      setUndoSnapshot(null);
      currentTurnHasMovesRef.current = false;
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

    const resolvedPlayerNames: [string, string] = [
      playerNames[0] || t(DEFAULT_PLAYER_NAMES[0]),
      playerNames[1] || t(DEFAULT_PLAYER_NAMES[1])
    ];

    const endGame = (winnerIndex?: number | null) => {
      const resolvedWinner = winnerIndex ?? currentPlayer;
      setPhase('gameEnd');
      setWinnerIndex(resolvedWinner);
      setIsGameEndDialogOpen(true);
      if (!isHumanVsHumanGame) {
        recordResult(resolvedWinner === chosenRoleIndex ? 'win' : 'loss');
      }
      trackEvent('game-finished', {
        game: gameId,
        mode,
        variant: selectedVariantIndex,
        ...(isHumanVsHumanGame ? {} : { result: resolvedWinner === chosenRoleIndex ? 'win' : 'loss' })
      });
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
      setBoard(undoSnapshot!.board);
      setCurrentPlayer(undoSnapshot!.currentPlayer);
      setMoveCount(undoSnapshot!.moveCount);
      setTurnState(null);
      setUndoSnapshot(null);
      currentTurnHasMovesRef.current = false;
    };

    const endTurn = () => {
      currentTurnHasMovesRef.current = false;
      setCurrentPlayer(p => 1 - p!);
    };

    const startGame = (roleIndex: number | null = null) => {
      setPhase('play');
      setCurrentPlayer(0);
      setChosenRoleIndex(roleIndex);
    };

    const isClientMoveAllowed = phase === 'play'
      && (isHumanVsHumanGame || currentPlayer === chosenRoleIndex);

    const ctx: Ctx = {
      isHumanVsHumanGame,
      resolvedPlayerNames,
      chosenRoleIndex,
      phase,
      turnState,
      currentPlayer,
      isClientMoveAllowed,
      winnerIndex,
      moveCount
    };

    // Bots chain the moves of a multi-move turn through setTimeout on the
    // wrappers captured when their turn started, so by the time the second
    // move dispatches, the render-scoped `ctx` those wrappers close over is
    // stale (e.g. `turnState` still null). Validators must judge the move
    // against the *current* game state, so they read `ctx` through this ref.
    const ctxRef = useRef(ctx);
    ctxRef.current = ctx;

    const events: Events = {
      endTurn,
      endGame,
      // Also patch turnState onto ctxRef synchronously: a chained dispatch can
      // validate before React re-renders (e.g. a bot's 0-delay setTimeout),
      // when the render-synced ref would still hold the previous turnState.
      setTurnState: (state) => {
        setTurnState(state);
        ctxRef.current = { ...ctxRef.current, turnState: state };
      }
    };

    wrappedGameMoves = mapValues(normalizedMoves, ({ legacyApply, apply }, name) => {
      const wrapped: GameMoves<TBoard>[string] = (board: TBoard, ...args: unknown[]) =>
        moveWrapper(name, board, args, () => apply
          ? apply(board, { ctx }, ...args)
          : legacyApply!(board, { ctx, events }, ...args));
      return wrapped;
    });

    // What the BoardClient receives: the same moves, but a dispatch is silently
    // ignored unless `isAllowed` holds — turn ownership (ctx.isClientMoveAllowed)
    // AND the move's validator. This engine-side gate replaces per-handler
    // `if (!allowed) return` guards, and also covers browsers that fire pointer
    // events on disabled buttons. Bots and the auto `endOfTurnMove` dispatch use
    // `wrappedGameMoves` instead: there an illegal move is a bug, and the
    // validator fails loudly (see `reportIllegalMove`).
    const clientGameMoves: GameMoves<TBoard> = mapValues(normalizedMoves, ({ validate }, name) => {
      const isAllowed = (board: TBoard, ...args: unknown[]) =>
        ctxRef.current.isClientMoveAllowed
          && (!validate || validate(board, { ctx: ctxRef.current }, ...args));
      const clientWrapped: GameMoves<TBoard>[string] = (board: TBoard, ...args: unknown[]) =>
        isAllowed(board, ...args) ? wrappedGameMoves[name]!(board, ...args) : { nextBoard: board };
      clientWrapped.isAllowed = isAllowed;
      return clientWrapped;
    });

    const doBotTurn = () => {
      const { botStrategy } = activeVariant;
      if (!botStrategy) throw new Error('strategyGameFactory: no botStrategy available for vsComputer mode');
      const time = Math.floor(Math.random() * 500 + 1000);
      botTimeoutRef.current = setTimeout(() => {
        botTimeoutRef.current = null;
        botStrategy({ board, ctx, moves: wrappedGameMoves });
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
