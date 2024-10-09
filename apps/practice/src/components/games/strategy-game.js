import React, { useState } from 'react';
import {
  GameSidebar, GameFooter, GameHeader, GameRule, GameEndDialog
} from './game-parts';
import { v4 as uuidv4 } from 'uuid';

export const strategyGameFactory = ({
  rule,
  title,
  roleLabels,
  initialTurnStages,
  GameBoard,
  generateStartBoard,
  moves,
  getGameStateAfterAiTurn,
  getPlayerStepDescription
}) => {
  return () => {
    const [board, setBoard] = useState(generateStartBoard())
    const [phase, setPhase] = useState('roleSelection');
    const [playerIndex, setPlayerIndex] = useState(null);
    const [next, setNext] = useState(null);
    const [isGameEndDialogOpen, setIsGameEndDialogOpen] = useState(false);
    const [winnerIndex, setWinnerIndex] = useState(null);
    const [gameUuid, setGameUuid] = useState(uuidv4());
    const [turnStage, setTurnStage] = useState(null);

    const startNewGame = () => {
      setBoard(generateStartBoard());
      setPhase('roleSelection');
      setPlayerIndex(null);
      setNext(null);
      setIsGameEndDialogOpen(false);
      setWinnerIndex(null);
      setGameUuid(uuidv4());
      setTurnStage(null);
    };

    const shouldPlayerMoveNext = (phase === 'play' && next === playerIndex);
    const isPlayerWinner = winnerIndex === playerIndex;

    const endGame = (winnerIndex) => {
      setPhase('gameEnd');
      setWinnerIndex(winnerIndex);
      setIsGameEndDialogOpen(true);
    };

    const endPlayerTurn = ({ nextBoard, isGameEnd, winnerIndex }) => {
      setBoard(nextBoard);
      setNext(next => 1 - next);

      if (isGameEnd) {
        // default: last player to move is the winner
        endGame(winnerIndex === null ? playerIndex : winnerIndex);
        return;
      }

      doAiTurn({ currentBoard: nextBoard });
    };

    const chooseRole = (playerIdx) => {
      setPhase('play');
      setNext(0);
      setPlayerIndex(playerIdx);
      if (initialTurnStages !== undefined) {
        setTurnStage(initialTurnStages[playerIdx]);
      }
      if (playerIdx === 1) {
        doAiTurn({ currentBoard: board });
      }
    };

    const ctx = {
      shouldPlayerMoveNext,
      playerIndex,
      phase,
      turnStage
    };

    const events = {
      endPlayerTurn,
      setTurnStage
    };

    const doAiTurn = ({ currentBoard }) => {
      const localPlayerIndex = playerIndex === null ? 1 : playerIndex;
      const time = Math.floor(Math.random() * 500 + 1000);
      setTimeout(() => {
        const { intermediateBoard, nextBoard, isGameEnd, winnerIndex } = getGameStateAfterAiTurn({
          board: currentBoard,
          ctx,
          events,
          moves: {
            // FIXME: general move, should not be needed if specialized functions
            // are provided for each move
            setBoard,
            ...moves
          }
        });
        const stageTimeout = intermediateBoard !== undefined ? 750 : 0;
        if (intermediateBoard !== undefined) {
          setBoard(intermediateBoard);
        }
        setTimeout(() => {
          setBoard(nextBoard);
          setNext(next => 1 - next);
          if (isGameEnd) {
            // default: last player to move is the winner
            endGame(winnerIndex === null ? (1 - localPlayerIndex) : winnerIndex);
          }
        }, stageTimeout);
      }, time);
    };

    return (
    <main className="p-2">
      <GameHeader title={title} />
      <div className="flex justify-center">
        <div className="max-w-[100ch] w-full">
          <GameRule ruleDescription={rule} />
          <div className="flex flex-wrap">
            <GameBoard
              key={gameUuid}
              board={board}
              ctx={ctx}
              events={events}
              moves={{ setBoard, ...moves }}
            />
            <GameSidebar
              roleLabels={roleLabels}
              stepDescription={getPlayerStepDescription({ board, ctx })}
              ctx={{ phase, shouldPlayerMoveNext, isPlayerWinner }}
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
        isPlayerWinner={isPlayerWinner}
      />
    </main>
    );
  };
};
