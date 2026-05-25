import React, { useState, useEffect } from 'react';
import { GameHeader, GameFooter, GameRule } from './game-parts/game-chrome';
import { GameSidebar } from './game-parts/game-sidebar';
import { GameEndDialog } from './game-parts/game-end-dialog';
import { mapValues } from 'lodash';
import { useTranslation, type TranslatableNode, type I18nString } from '../language/translate';
import { useLocation } from 'react-router';
import { useGameStats } from './use-game-stats';
import type {
  Phase, Mode, Ctx, Events, MoveResult, MoveFunction, GameMoves,
  BoardClientProps, Variant as DisplayVariant, VariantInput
} from './types';
import { resolveVariants } from './resolve-variants';

const DEFAULT_PLAYER_NAMES: I18nString[] = [
  { hu: '1. játékos', en: '1st player' },
  { hu: '2. játékos', en: '2nd player' }
];

export interface Presentation<TBoard> {
  rule: TranslatableNode
  roleLabels?: [I18nString, I18nString]
  getPlayerStepDescription: (args: { board: TBoard; ctx: Ctx }) => TranslatableNode
}

export interface Gameplay<TBoard> {
  moves: Record<string, MoveFunction<TBoard>>
  endOfTurnMove?: string
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
    const [turnState, setTurnState] = useState<unknown>(null);
    const [mode, setMode] = useState<Mode>('vsComputer');
    const [playerNames, setPlayerNames] = useState(['', '']);

    const isHumanVsHumanGame = mode === 'vsHuman';

    const gameId = useLocation().pathname.split('/').pop()!;
    const { stats, recordResult, resetStats } = useGameStats(gameId, selectedVariantIndex);

    useEffect(() => {
      if (!isHumanVsHumanGame && phase === 'play' && currentPlayer === (1 - chosenRoleIndex!)) {
        doBotTurn();
      }
    }, [currentPlayer]);

    let wrappedGameMoves: GameMoves<TBoard> = {} as GameMoves<TBoard>;

    const moveWrapper = (doMove: () => MoveResult<TBoard>): MoveResult<TBoard> => {
      const moveResult = doMove();
      setBoard(moveResult.nextBoard);
      if (endOfTurnMove && moveResult.autoEndOfTurn) {
        setTimeout(() => {
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
      setTurnState(null);
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
    };

    const endTurn = () => {
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
      winnerIndex
    };

    const events: Events = {
      endTurn,
      endGame,
      setTurnState
    };

    wrappedGameMoves = mapValues(
      moves,
      (f) => (board: TBoard, ...args: unknown[]) => moveWrapper(() => f(board, { ctx, events }, ...args))
    ) as GameMoves<TBoard>;

    const doBotTurn = () => {
      const { botStrategy } = activeVariant;
      if (!botStrategy) throw new Error('strategyGameFactory: no botStrategy available for vsComputer mode');
      const time = Math.floor(Math.random() * 500 + 1000);
      setTimeout(() => {
        botStrategy({ board, ctx, moves: wrappedGameMoves });
      }, time);
    };

    const visibleVariants = getVariantsForMode(mode);

    return (
    <main className="flex flex-col p-2 min-h-screen">
      <GameHeader />
      <div className="flex justify-center grow">
        <div className="max-w-[100ch] w-full">
          <GameRule ruleDescription={t(rule)} />
          <div className="flex flex-wrap">
            <BoardClient
              key={gameUuid}
              board={board}
              ctx={ctx}
              events={events}
              moves={wrappedGameMoves}
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
                setDifficulty
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

export const dummyEvents: Events = {
  endTurn: () => {},
  endGame: () => {},
  setTurnState: () => {}
};
