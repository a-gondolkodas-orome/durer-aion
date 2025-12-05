import React, { useState, useEffect } from 'react';
import {
  GameSidebar, GameFooter, GameHeader, GameRule, GameEndDialog
} from './game-parts';
import { partial, mapValues, wrap, _ } from 'lodash';

export const strategyGameFactory = ({
  rule,
  title,
  roleLabels,
  BoardClient,
  generateStartBoard,
  moves,
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
    const [gameUuid, setGameUuid] = useState(crypto.randomUUID());
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
      setGameUuid(crypto.randomUUID());
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

    // only second argument of move's is fixed here (_ special syntax)
    // board (first argument) needs to be handled by ai strategy as
    // it may change between moves but for AI strategy there is no re-render between moves
    // in some cases there are multiple moves following single user event in that
    // case there is also no re-render on client side between moves
    const wrappedMoves = mapValues(moves, f => wrap(partial(f, _, { ctx, events }), moveWrapper));

    const doAiTurn = () => {
      const time = Math.floor(Math.random() * 500 + 1000);
      setTimeout(() => {
        aiBotStrategy({ board, ctx, moves: wrappedMoves });
      }, time);
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
              moves={wrappedMoves}
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

export const dummyEvents = {
  endTurn: () => {},
  endGame: () => {},
  setTurnStage: () => {}
}
