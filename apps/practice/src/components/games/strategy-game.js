import React, { useState } from 'react';
import {
  GameSidebar, GameFooter, GameHeader, GameRule, GameEndDialog
} from './game-parts';
import { v4 as uuidv4 } from 'uuid';

export const strategyGameFactory = ({ rule, title, firstRoleLabel, secondRoleLabel, GameBoard, G }) => {
  return ({ board, setBoard }) => {
    const [phase, setPhase] = useState('roleSelection');
    const [playerIndex, setPlayerIndex] = useState(null);
    const [next, setNext] = useState(null);
    const [isGameEndDialogOpen, setIsGameEndDialogOpen] = useState(false);
    const [winnerIndex, setWinnerIndex] = useState(null);
    const [gameUuid, setGameUuid] = useState(uuidv4());
    const [turnStage, setTurnStage] = useState(null);

    const startNewGame = () => {
      setBoard(G.generateStartBoard());
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

    const doAiTurn = ({ currentBoard }) => {
      const localPlayerIndex = playerIndex === null ? 1 : playerIndex;
      const time = Math.floor(Math.random() * 500 + 1000);
      setTimeout(() => {
        const { intermediateBoard, nextBoard, isGameEnd, winnerIndex } = G.getGameStateAfterAiTurn(
          { board: currentBoard, setBoard, playerIndex: localPlayerIndex }
        );
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
      if (playerIdx === 1) {
        doAiTurn({ currentBoard: board });
      }
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
              setBoard={setBoard}
              ctx={{
                shouldPlayerMoveNext,
                endPlayerTurn,
                playerIndex,
                phase,
                turnStage,
                setTurnStage
              }}
            />
            <GameSidebar
              firstRoleLabel={firstRoleLabel}
              secondRoleLabel={secondRoleLabel}
              stepDescription={G.getPlayerStepDescription({ board, playerIndex, turnStage })}
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
