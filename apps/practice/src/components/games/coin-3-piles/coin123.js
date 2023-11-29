import React, { useState } from 'react';
import { random, sum } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { getGameStateAfterAiTurn, isWinningState  } from './strategy/strategy';
import { GameBoard, getPlayerStepDescription } from './coin-3-piles';

const generateNewBoard = () => {
  if (random(0, 1)) {
    return generateNewWinningBoard();
  } else {
    return generateNewLosingBoard();
  }
};

const generateNewWinningBoard = () => {
  const board = [random(0, 5), random(0, 7), random(1, 8)];
  if (!isWinningState({ board }) && sum(board) >= 4) return board;
  return generateNewWinningBoard();
}

const generateNewLosingBoard = () => {
  const board = [random(0, 5), random(0, 7), random(1, 8)];
  if (isWinningState({ board }) && sum(board) >= 4) return board;
  return generateNewLosingBoard();
}

const rule = <>
  Van egy kupacban néhány érme, mindegyik 1, 2 vagy 3 pengős. Egy lépésben az
  éppen soron lévő játékos elvesz egy érmét a kupacból, és helyette berakhat egy darab kisebb
  értékű érmét, vagy dönthet úgy, hogy nem tesz be semmit. Az nyer, aki elveszi az utolsó érmét
  a kupacból.

  Az új játék gombra kattintva generálhatsz egy új kezdőállást. A kezdőállás ismeretében te döntheted el, hogy kezdeni
  szeretnél-e, vagy második játékos lenni.
  Sok sikert! :)
</>;

const Game = strategyGameFactory({
  rule,
  title: '3, 2, 1 érmék',
  GameBoard,
  G: {
    getPlayerStepDescription,
    generateNewBoard,
    getGameStateAfterAiTurn
  }
});

export const Coin123 = () => {
  const [board, setBoard] = useState(generateNewBoard());

  return <Game board={board} setBoard={setBoard} />;
};
