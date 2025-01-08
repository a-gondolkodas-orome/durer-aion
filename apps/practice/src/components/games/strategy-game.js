import React, { useState, useEffect } from 'react';
import {
  GameSidebar, GameFooter, GameHeader, GameRule, GameEndDialog
} from './game-parts';
import { v4 as uuidv4 } from 'uuid';
import { partial, mapValues, wrap, _ } from 'lodash';

export const strategyGameFactory = ({
  rule,
  title,
  roleLabels,
  initialTurnStages,
  BoardClient,
  generateStartBoard,
  moves,
  getGameStateAfterAiTurn,
  aiBotStrategy,
  getPlayerStepDescription
}) => {
  return () => {
    const [board, setBoard] = useState(generateStartBoard())
    const [phase, setPhase] = useState('roleSelection');
    const [chosenRoleIndex, setChosenRoleIndex] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [isGameEndDialogOpen, setIsGameEndDialogOpen] = useState(false);
    const [winnerIndex, setWinnerIndex] = useState(null);
    const [gameUuid, setGameUuid] = useState(uuidv4());
    const [turnStage, setTurnStage] = useState(null);

    useEffect(() => {
      if (phase === 'play' && currentPlayer === (1 - chosenRoleIndex)) {
        doAiTurn();
      }
    }, [currentPlayer])

    const moveWrapper = (moveFunc, ...args) => {
      const moveResult = moveFunc(...args);
      setBoard(moveResult.nextBoard);
      return moveResult;
    };

    const startNewGame = () => {
      setBoard(generateStartBoard());
      setPhase('roleSelection');
      setChosenRoleIndex(null);
      setCurrentPlayer(null);
      setIsGameEndDialogOpen(false);
      setWinnerIndex(null);
      setGameUuid(uuidv4());
      setTurnStage(null);
    };

    const shouldRoleSelectorMoveNext = (phase === 'play' && currentPlayer === chosenRoleIndex);
    const isRoleSelectorWinner = winnerIndex === chosenRoleIndex;

    const endGame = ({ winnerIndex } = { winnerIndex: null }) => {
      setPhase('gameEnd');
      // default: last player to move is the winner
      setWinnerIndex(winnerIndex === null ? currentPlayer : winnerIndex);
      setIsGameEndDialogOpen(true);
    };

    const endTurn = () => {
      setCurrentPlayer(currentPlayer => 1 - currentPlayer);
    };

    const chooseRole = (playerIdx) => {
      setPhase('play');
      setCurrentPlayer(0);
      setChosenRoleIndex(playerIdx);
      if (initialTurnStages !== undefined) {
        setTurnStage(initialTurnStages[playerIdx]);
      }
    };

    const ctx = {
      shouldRoleSelectorMoveNext,
      chosenRoleIndex,
      currentPlayer,
      phase,
      turnStage
    };

    const events = {
      endTurn,
      endGame,
      setTurnStage
    };

    const doAiTurn = () => {
      const time = Math.floor(Math.random() * 500 + 1000);
      setTimeout(() => {
        if (aiBotStrategy !== undefined) {
          aiBotStrategy({
            board,
            ctx,
            // only second argument of move's is fixed here (_ special syntax)
            // board (first argument) needs to be handled by ai strategy as
            // it may change between moves but for AI strategy there is no re-render between moves
            moves: mapValues(moves, f => wrap(partial(f, _, { ctx, events }), moveWrapper))
          });
        } else {
          oldAiMove();
        }
      }, time);
    };

    const oldAiMove = () => {
      const { intermediateBoard, nextBoard, isGameEnd, winnerIndex } = getGameStateAfterAiTurn({
        board,
        ctx,
        events,
        moves: { setBoard }
      });
      const stageTimeout = intermediateBoard !== undefined ? 750 : 0;
      if (intermediateBoard !== undefined) {
        setBoard(intermediateBoard);
      }
      setTimeout(() => {
        setBoard(nextBoard);
        if (isGameEnd) {
          endGame({ winnerIndex });
        }
        setCurrentPlayer(currentPlayer => 1 - currentPlayer);
      }, stageTimeout);
    };

    const clientSideMoves = {
      ...mapValues(moves, f => wrap(partial(f, _, { ctx, events }), moveWrapper)),
      // FIXME: general move, should not be needed if specialized functions
      // are provided for each move
      setBoard
    };

    return (
    <main className="p-2">
      <GameHeader title={title} />
      <div className="flex justify-center">
        <div className="max-w-[100ch] w-full">
          <GameRule ruleDescription={rule} />
          <div className="flex flex-wrap">
            <BoardClient
              key={gameUuid}
              board={board}
              ctx={ctx}
              events={events}
              moves={clientSideMoves}
            />
            <GameSidebar
              roleLabels={roleLabels}
              stepDescription={getPlayerStepDescription({ board, ctx })}
              ctx={{ phase, shouldRoleSelectorMoveNext, isRoleSelectorWinner }}
              moves={{ chooseRole, startNewGame }}
            />
          </div>
        </div>
      </div>
      <GameFooter />
      <GameEndDialog
        isOpen={isGameEndDialogOpen}
        setIsOpen={setIsGameEndDialogOpen}
        startNewGame={startNewGame}
        isRoleSelectorWinner={isRoleSelectorWinner}
      />
    </main>
    );
  };
};
