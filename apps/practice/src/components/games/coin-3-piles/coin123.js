import React from 'react';
import { random, sum } from 'lodash';
import { strategyGameFactory } from '../strategy-game';
import { aiBotStrategy  } from './bot-strategy';
import { BoardClient } from './board-client';
import { getPlayerStepDescription, isWinningState, moves } from './helpers';
import { gameList } from '../gameList';

const generateStartBoard = () => {
  if (random(0, 1)) {
    return generateWinningStartBoard();
  } else {
    return generateLosingStartBoard();
  }
};

const generateWinningStartBoard = () => {
  const board = [random(0, 5), random(0, 7), random(1, 8)];
  if (!isWinningState({ board }) && sum(board) >= 4) return board;
  return generateWinningStartBoard();
}

const generateLosingStartBoard = () => {
  const board = [random(0, 5), random(0, 7), random(1, 8)];
  if (isWinningState({ board }) && sum(board) >= 4) return board;
  return generateLosingStartBoard();
}

const rule = <>
  Van egy kupacban néhány érme, mindegyik 1, 2 vagy 3 pengős. Egy lépésben az
  éppen soron lévő játékos elvesz egy érmét a kupacból, és helyette berakhat egy darab kisebb
  értékű érmét, vagy dönthet úgy, hogy nem tesz be semmit. Az nyer, aki elveszi az utolsó érmét
  a kupacból.
</>;

export const Coin123 = strategyGameFactory({
  rule,
  metadata: gameList.Coin123,
  BoardClient,
  getPlayerStepDescription,
  generateStartBoard,
  moves,
  aiBotStrategy
});
