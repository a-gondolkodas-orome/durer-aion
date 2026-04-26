import React, { useState, useEffect } from 'react';
import {
  GameSidebar, GameFooter, GameHeader, GameRule, GameEndDialog
} from './game-parts';
import { partial, mapValues, wrap, _ } from 'lodash';
import { useTranslation } from '../language/translate';

export const resolveVariants = (variants) => {
  if (!variants || variants.length === 0) {
    throw new Error('strategyGameFactory: variants must be a non-empty array');
  }
  if (variants.length > 1 && variants.filter(v => v.isDefault).length !== 1) {
    throw new Error('strategyGameFactory: exactly one variant must have isDefault: true');
  }
  const defaultVariantIndex = Math.max(variants.findIndex(v => v.isDefault), 0);
  const defaultVariant = variants[defaultVariantIndex];
  if (!defaultVariant.generateStartBoard) {
    throw new Error('strategyGameFactory: the default variant must define generateStartBoard');
  }
  const fallbackBotStrategy = defaultVariant.botStrategy
    ?? variants.find(v => v.botStrategy)?.botStrategy;
  const resolvedVariants = variants.map(v => ({ ...v, botStrategy: v.botStrategy ?? fallbackBotStrategy }));
  return { defaultVariantIndex, defaultVariant, resolvedVariants };
};

export const strategyGameFactory = ({
  presentation,
  BoardClient,
  gameplay,
  variants
}) => {
  const { rule, title, credit, roleLabels, getPlayerStepDescription } = presentation;
  const { moves, endOfTurnMove } = gameplay;
  const { defaultVariantIndex, defaultVariant, resolvedVariants } = resolveVariants(variants);

  return () => {
    const { t } = useTranslation();
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(defaultVariantIndex);
    const activeVariant = resolvedVariants[selectedVariantIndex] ?? defaultVariant;
    const defaultGenerateStartBoard = defaultVariant.generateStartBoard;
    const activeGenerateStartBoard = activeVariant.generateStartBoard ?? defaultGenerateStartBoard;

    const [board, setBoard] = useState(activeGenerateStartBoard());
    const [phase, setPhase] = useState('roleSelection');
    const [chosenRoleIndex, setChosenRoleIndex] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [isGameEndDialogOpen, setIsGameEndDialogOpen] = useState(false);
    const [winnerIndex, setWinnerIndex] = useState(null);
    const [gameUuid, setGameUuid] = useState(crypto.randomUUID());
    const [turnStage, setTurnStage] = useState(null);
    const [mode, setMode] = useState('vsComputer');
    const [playerNames, setPlayerNames] = useState(['', '']);

    const isHumanVsHumanGame = mode === 'vsHuman';

    useEffect(() => {
      if (!isHumanVsHumanGame && phase === 'play' && currentPlayer === (1 - chosenRoleIndex)) {
        doBotTurn();
      }
    }, [currentPlayer]);

    let wrappedMoves;

    const moveWrapper = (moveFunc, ...args) => {
      const moveResult = moveFunc(...args);
      setBoard(moveResult.nextBoard);
      if (endOfTurnMove && moveResult.autoEndOfTurn) {
        setTimeout(() => {
          wrappedMoves[endOfTurnMove](moveResult.nextBoard);
        }, 750);
      }
      return moveResult;
    };

    const resetGameState = (generateBoard = activeGenerateStartBoard) => {
      setBoard(generateBoard());
      setPhase('roleSelection');
      setChosenRoleIndex(null);
      setCurrentPlayer(null);
      setIsGameEndDialogOpen(false);
      setWinnerIndex(null);
      setGameUuid(crypto.randomUUID());
      setTurnStage(null);
    };

    const switchMode = (newMode) => {
      setMode(newMode);
      if (newMode === 'vsHuman' && !activeVariant.generateStartBoard) {
        setSelectedVariantIndex(defaultVariantIndex);
        resetGameState(defaultVariant.generateStartBoard);
      } else {
        resetGameState();
      }
    };

    const setDifficulty = (index) => {
      setSelectedVariantIndex(index);
      const newVariant = resolvedVariants[index] ?? defaultVariant;
      resetGameState(newVariant.generateStartBoard ?? defaultGenerateStartBoard);
    };

    const endGame = ({ winnerIndex = null } = {}) => {
      setPhase('gameEnd');
      setWinnerIndex(winnerIndex === null ? currentPlayer : winnerIndex);
      setIsGameEndDialogOpen(true);
    };

    const endTurn = () => {
      setCurrentPlayer(currentPlayer => 1 - currentPlayer);
    };

    const startGame = (roleIndex = null) => {
      setPhase('play');
      setCurrentPlayer(0);
      setChosenRoleIndex(roleIndex);
    };

    const playerNameOf = (index) => {
      if (index === null) return null;
      return playerNames[index] || t({
        hu: index === 0 ? '1. játékos' : '2. játékos',
        en: index === 0 ? '1st player' : '2nd player'
      });
    };

    const isClientMoveAllowed = phase === 'play'
      && (isHumanVsHumanGame || currentPlayer === chosenRoleIndex);

    const ctx = {
      isHumanVsHumanGame,
      playerNames,
      chosenRoleIndex,
      phase,
      turnStage,
      currentPlayer,
      currentPlayerName: playerNameOf(currentPlayer),
      isClientMoveAllowed,
      isRoleSelectorWinner: (winnerIndex === chosenRoleIndex),
      winnerName: playerNameOf(winnerIndex)
    };

    const events = {
      endTurn,
      endGame,
      setTurnStage
    };

    /*
    Only second argument of move's is fixed here (_ special syntax). board
    (first argument) needs to be handled by the bot as it may change between
    moves, but for the bot there is no re-render between moves. In some
    cases there are multiple moves following single user event, in that case,
    there is also no re-render on client side between moves.
    */
    wrappedMoves = mapValues(
      moves,
      f => wrap(partial(f, _, { ctx, events }), moveWrapper)
    );

    const doBotTurn = () => {
      const { botStrategy } = activeVariant;
      if (!botStrategy) throw new Error('strategyGameFactory: no botStrategy available for vsComputer mode');
      const time = Math.floor(Math.random() * 500 + 1000);
      setTimeout(() => {
        botStrategy({ board, ctx, moves: wrappedMoves });
      }, time);
    };

    const visibleVariants = resolvedVariants
      .map((v, i) => ({ ...v, originalIndex: i, disabled: !isHumanVsHumanGame && !v.botStrategy }))
      .filter(v => !isHumanVsHumanGame || !!v.generateStartBoard);

    return (
    <main className="flex flex-col p-2 min-h-screen">
      <GameHeader title={t(title)} />
      <div className="flex justify-center grow">
        <div className="max-w-[100ch] w-full">
          <GameRule ruleDescription={t(rule)} />
          <div className="flex flex-wrap">
            <BoardClient
              key={gameUuid}
              board={board}
              ctx={ctx}
              events={events}
              moves={wrappedMoves}
            />
            <GameSidebar
              roleLabels={roleLabels}
              stepDescription={t(getPlayerStepDescription({ board, ctx }))}
              ctx={ctx}
              moves={{ startGame, resetGameState, switchMode, setPlayerNames, setDifficulty }}
              variants={visibleVariants}
              selectedVariantIndex={selectedVariantIndex}
            />
          </div>
        </div>
      </div>
      <GameFooter credit={credit}/>
      <GameEndDialog
        isOpen={isGameEndDialogOpen}
        setIsOpen={setIsGameEndDialogOpen}
        resetGameState={resetGameState}
        ctx={ctx}
      />
    </main>
    );
  };
};

export const dummyEvents = {
  endTurn: () => {},
  endGame: () => {},
  setTurnStage: () => {}
}
